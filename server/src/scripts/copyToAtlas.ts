import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const ATLAS_MONGODB_URL = process.env.ME_CONFIG_MONGODB_URL as string;
const MONGODB_PARAMS = process.env.MONGODB_PARAMS || '';
const LOCAL_MONGODB_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'transactionsdb_v2';

if (!ATLAS_MONGODB_URL) {
  console.error('Missing ME_CONFIG_MONGODB_URL in .env');
  process.exit(1);
}

async function copyToAtlas() {
  console.log(`Starting data copy from local ${DB_NAME} to Atlas...`);

  const atlasUrl = ATLAS_MONGODB_URL.endsWith('/')
    ? `${ATLAS_MONGODB_URL}${DB_NAME}${MONGODB_PARAMS}`
    : `${ATLAS_MONGODB_URL}/${DB_NAME}${MONGODB_PARAMS}`;

  // 1. Connect to Local DB
  console.log('Connecting to Local DB...');
  const localConnection = await mongoose
    .createConnection(`${LOCAL_MONGODB_URL}/${DB_NAME}`)
    .asPromise();
  const localDb = localConnection.db;
  if (!localDb) throw new Error('Could not connect to local DB');
  console.log('Connected to Local DB.');

  // 2. Connect to Atlas DB
  console.log('Connecting to Atlas DB...');
  const atlasConnection = await mongoose
    .createConnection(atlasUrl)
    .asPromise();
  const atlasDb = atlasConnection.db;
  if (!atlasDb) throw new Error('Could not connect to Atlas DB');
  console.log('Connected to Atlas DB.');

  // 3. Get all collections from local DB
  const collections = await localDb.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  console.log(`Found ${collectionNames.length} collections to copy:`, collectionNames);

  // 4. Copy each collection
  for (const collName of collectionNames) {
    console.log(`\n--- Processing collection: ${collName} ---`);
    const docs = await localDb.collection(collName).find({}).toArray();

    if (docs.length === 0) {
      console.log(`Skipping ${collName} - no documents found.`);
      continue;
    }

    // Clear existing data in the target collection to avoid duplicate key errors
    try {
      await atlasDb.collection(collName).drop();
      console.log(`Dropped existing collection ${collName} in Atlas`);
    } catch (e: any) {
      if (e.codeName !== 'NamespaceNotFound') {
        console.warn(`Could not drop collection ${collName}:`, e.message);
      }
    }

    // Insert documents
    await atlasDb.collection(collName).insertMany(docs);
    console.log(`Successfully copied ${docs.length} documents into ${collName}`);
  }

  console.log('\nData copy complete!');

  // Close connections
  await localConnection.close();
  await atlasConnection.close();
  process.exit(0);
}

copyToAtlas().catch((err) => {
  console.error('Data copy failed:', err);
  process.exit(1);
});
