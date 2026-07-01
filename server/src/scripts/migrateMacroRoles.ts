import dotenv from 'dotenv';
dotenv.config();

import UserModel from '../models/user.model';
import connectToMongoDB from '../database/mongodb';

async function migrateRoles() {
  try {
    console.log('Connecting to database...');
    await connectToMongoDB();
    console.log('Connected.');

    // Get all users
    const users = await UserModel.find({});
    console.log(`Found ${users.length} users. Migrating macro-roles...`);
    
    let studentCount = 0;
    let centralAdminCount = 0;
    let orgAdminCount = 0;
    let unchangedCount = 0;

    for (const user of users) {
      // Need to cast to any to read old values without TS error
      const currentRole = (user as any).role;
      
      let newRole = '';

      if (currentRole === 'regular' || currentRole === 'student') {
        newRole = 'student';
      } else if (currentRole === 'admin' || currentRole === 'central-admin') {
        newRole = 'central-admin';
      } else {
        // Fallback for governor, treasurer, auditor, org-admin, etc.
        newRole = 'org-admin';
      }

      if (currentRole !== newRole) {
        user.role = newRole as any;
        await user.save();
        
        if (newRole === 'student') studentCount++;
        if (newRole === 'central-admin') centralAdminCount++;
        if (newRole === 'org-admin') orgAdminCount++;
      } else {
        unchangedCount++;
      }
    }

    console.log(`\nMigration Complete:`);
    console.log(`- Users migrated to 'student': ${studentCount}`);
    console.log(`- Users migrated to 'central-admin': ${centralAdminCount}`);
    console.log(`- Users migrated to 'org-admin': ${orgAdminCount}`);
    console.log(`- Users unchanged (already migrated): ${unchangedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRoles();
