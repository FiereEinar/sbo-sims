import dotenv from 'dotenv';
import UserModel from './models/user.model';
import { ADMIN_ID } from './constants/env';
import connectToMongoDB from './database/mongodb';
dotenv.config();

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
