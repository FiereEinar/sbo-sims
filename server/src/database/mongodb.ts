import mongoose from 'mongoose';
import { ME_CONFIG_MONGODB_URL } from '../constants/env';
import { originalDbName } from '../constants';

export default async function connectToMongoDB(): Promise<void> {
  try {
    const dburl = ME_CONFIG_MONGODB_URL.endsWith('/')
      ? ME_CONFIG_MONGODB_URL + originalDbName
      : ME_CONFIG_MONGODB_URL + '/' + originalDbName;
    await mongoose.connect(dburl);
  } catch (err: any) {
    console.error('Failed to connect to MongoDB', err);
  }
}
