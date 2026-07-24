import mongoose from 'mongoose';
import {
  DATABASE_NAME,
  ME_CONFIG_MONGODB_URL,
  MONGODB_PARAMS,
} from '../constants/env';

export default async function connectToMongoDB(): Promise<void> {
  try {
    const dburl =
      (ME_CONFIG_MONGODB_URL.endsWith('/')
        ? ME_CONFIG_MONGODB_URL + DATABASE_NAME
        : ME_CONFIG_MONGODB_URL + '/' + DATABASE_NAME) + MONGODB_PARAMS;
    await mongoose.connect(dburl);
  } catch (err: any) {
    console.error('Failed to connect to MongoDB', err);
  }
}
