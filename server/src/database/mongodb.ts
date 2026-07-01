import mongoose from 'mongoose';
import { ME_CONFIG_MONGODB_URL, MONGODB_PARAMS } from '../constants/env';
import { originalDbName } from '../constants';

export default async function connectToMongoDB(): Promise<void> {
  try {
    const dburl =
      (ME_CONFIG_MONGODB_URL.endsWith('/')
        ? ME_CONFIG_MONGODB_URL + originalDbName
        : ME_CONFIG_MONGODB_URL + '/' + originalDbName) + MONGODB_PARAMS;
    await mongoose.connect(dburl);
  } catch (err: any) {
    console.error('Failed to connect to MongoDB', err);
  }
}
