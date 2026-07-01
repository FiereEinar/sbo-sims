import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import UserModel from './models/user.model';
import { getDatabaseConnection } from './database/databaseManager';
import { originalDbName } from './constants';
import { ADMIN_ID } from './constants/env';
import connectToMongoDB from './database/mongodb';

async function testAdminLogin() {
  try {
    await connectToMongoDB();
    console.log('Connected to DB');

    const adminUser = await UserModel.findOne({ studentID: ADMIN_ID }).lean();
    console.log('Admin user found:', adminUser);

    if (adminUser) {
      console.log('Admin user role:', adminUser.role);
    } else {
      console.log('Admin user NOT FOUND by studentID:', ADMIN_ID);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testAdminLogin();
