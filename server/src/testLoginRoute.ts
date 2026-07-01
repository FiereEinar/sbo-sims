import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import UserModel from './models/user.model';
import './models/role.model';
import { ADMIN_ID, ADMIN_PASS } from './constants/env';
import connectToMongoDB from './database/mongodb';
import bcrypt from 'bcryptjs';

async function debugAdminLogin() {
  try {
    await connectToMongoDB();

    const studentID = ADMIN_ID;
    const password = ADMIN_PASS;

    const user = await UserModel.findOne({
      studentID,
      role: 'central-admin',
    }).populate('rbacRole').exec();

    console.log('[DEBUG] Admin user found:', user ? 'yes' : 'no');
    
    if (user) {
      console.log('[DEBUG] user.password length:', user.password.length);
      const match = await bcrypt.compare(password, user.password);
      console.log('[DEBUG] Password match:', match);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugAdminLogin();
