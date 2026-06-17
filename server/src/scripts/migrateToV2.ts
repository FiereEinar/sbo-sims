import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let SOURCE_MONGODB_URL = process.env.ME_CONFIG_MONGODB_URL as string;
const MONGODB_PARAMS = process.env.MONGODB_PARAMS || '';
const DEST_MONGODB_URL = 'mongodb://127.0.0.1:27017';
const ORIGINAL_DB_NAME = 'transactionsdb';
const NEW_DB_NAME = 'transactionsdb_v2';

if (!SOURCE_MONGODB_URL) {
  console.error('Missing ME_CONFIG_MONGODB_URL in .env');
  process.exit(1);
}

if (SOURCE_MONGODB_URL.endsWith('/')) {
  SOURCE_MONGODB_URL = SOURCE_MONGODB_URL.slice(0, -1);
}

async function runMigration() {
  console.log(
    `Starting migration from ${ORIGINAL_DB_NAME} to ${NEW_DB_NAME}...`,
  );

  // 1. Connect to cluster to list databases
  const connection = await mongoose
    .createConnection(`${SOURCE_MONGODB_URL}/admin${MONGODB_PARAMS}`)
    .asPromise();
  const adminDb = connection.db?.admin();
  if (!adminDb) throw new Error('Could not access admin db');

  const { databases } = await adminDb.listDatabases();
  console.log(`Found ${databases.length} databases in cluster.`);

  // 2. Setup destination connection
  const destConnection = await mongoose
    .createConnection(`${DEST_MONGODB_URL}/${NEW_DB_NAME}`)
    .asPromise();
  const destDb = destConnection.db;
  if (!destDb) throw new Error('Could not connect to destination DB');

  // Clear destination DB to ensure clean migration
  await destDb.dropDatabase();
  console.log(`Cleared existing data in ${NEW_DB_NAME}`);

  // 3. Connect to Original Global DB
  const originalDbConnection = await mongoose
    .createConnection(`${SOURCE_MONGODB_URL}/${ORIGINAL_DB_NAME}${MONGODB_PARAMS}`)
    .asPromise();
  const originalDb = originalDbConnection.db;
  if (!originalDb) throw new Error('Could not connect to original global DB');

  // A. Copy Global Collections
  console.log('\n--- Copying global collections ---');
  const collectionsToCopy = [
    'organizations',
    'users',
    'roles',
    'sessions',
    'appsettings',
  ];

  let mainOrgId: mongoose.Types.ObjectId | null = null;

  for (const collName of collectionsToCopy) {
    const docs = await originalDb.collection(collName).find({}).toArray();
    if (docs.length > 0) {
      if (collName === 'organizations') {
        // Add slugs to organizations
        docs.forEach((doc) => {
          doc.slug = doc.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
          mainOrgId = doc._id; // Store for semester injection
        });
      }

      if (collName === 'users' && mainOrgId) {
        // Assign all existing users to the main organization
        docs.forEach((doc) => {
          doc.organization = mainOrgId;
        });
      }

      await destDb.collection(collName).insertMany(docs);
      console.log(`Copied ${docs.length} documents into ${collName}`);
    }
  }

  if (!mainOrgId) {
    console.warn(
      'WARNING: No organization found in original DB. Creating a default one.',
    );
    const result = await destDb.collection('organizations').insertOne({
      name: 'Default Organization',
      slug: 'default-organization',
      governor: 'Unknown',
      viceGovernor: 'Unknown',
      treasurer: 'Unknown',
      auditor: 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mainOrgId = result.insertedId;
  }

  // 4. Find Semester Databases
  // Assuming format like "12023", "22023" (starts with 1 or 2, followed by year)
  const semesterRegex = /^[12]\d{4}$/;
  const semesterDbs = databases
    .filter((db) => semesterRegex.test(db.name))
    .map((db) => db.name);
  console.log(`\nFound ${semesterDbs.length} semester databases:`, semesterDbs);

  for (const dbName of semesterDbs) {
    console.log(`\n--- Migrating semester DB: ${dbName} ---`);
    const semester = dbName.substring(0, 1);
    const schoolYear = dbName.substring(1);
    const termFields = { semester, schoolYear, organization: mainOrgId };

    const termDbConnection = await mongoose
      .createConnection(`${SOURCE_MONGODB_URL}/${dbName}${MONGODB_PARAMS}`)
      .asPromise();
    const termDb = termDbConnection.db;
    if (!termDb) throw new Error(`Could not connect to ${dbName}`);

    // B. Copy Students
    const students = await termDb.collection('students').find({}).toArray();
    if (students.length > 0) {
      const studentsToInsert = students.map((s) => ({ ...s, ...termFields }));
      await destDb.collection('students').insertMany(studentsToInsert);
      console.log(`Copied ${students.length} students`);
    }

    // C. Copy Categories
    const categories = await termDb.collection('categories').find({}).toArray();
    if (categories.length > 0) {
      // Categories already have organization reference from old DB, just need sem/year
      const categoriesToInsert = categories.map((c) => ({
        ...c,
        semester,
        schoolYear,
      }));
      await destDb.collection('categories').insertMany(categoriesToInsert);
      console.log(`Copied ${categories.length} categories`);
    }

    // D. Copy Transactions
    const transactions = await termDb
      .collection('transactions')
      .find({})
      .toArray();
    if (transactions.length > 0) {
      const transactionsToInsert = transactions.map((t) => ({
        ...t,
        ...termFields,
      }));
      await destDb.collection('transactions').insertMany(transactionsToInsert);
      console.log(`Copied ${transactions.length} transactions`);
    }

    // E. Copy Prelistings
    const prelistings = await termDb
      .collection('prelistings')
      .find({})
      .toArray();
    if (prelistings.length > 0) {
      const prelistingsToInsert = prelistings.map((p) => ({
        ...p,
        ...termFields,
      }));
      await destDb.collection('prelistings').insertMany(prelistingsToInsert);
      console.log(`Copied ${prelistings.length} prelistings`);
    }

    await termDbConnection.close();
  }

  console.log(
    '\nMigration complete! All data has been merged into',
    NEW_DB_NAME,
  );

  // Close connections
  await connection.close();
  await destConnection.close();
  await originalDbConnection.close();

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
