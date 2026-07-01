import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import UserModel from './models/user.model';
import { ADMIN_ID, ADMIN_PASS, BCRYPT_SALT } from './constants/env';
import connectToMongoDB from './database/mongodb';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  try {
    await connectToMongoDB();
    console.log('Connected to DB');

    const adminUser = await UserModel.findOne({ studentID: ADMIN_ID });
    
    if (adminUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASS, parseInt(BCRYPT_SALT));
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('Admin password successfully reset to match .env ADMIN_PASS.');
    } else {
      console.log('Admin user not found.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetAdminPassword();
