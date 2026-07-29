import mongoose from 'mongoose';
import {
  DATABASE_NAME,
  ME_CONFIG_MONGODB_URL,
  MONGODB_PARAMS,
} from '../constants/env';

// Cache the connection promise on the global object so Vercel warm containers
// reuse the existing connection instead of opening a new one each invocation.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined;
}

export default async function connectToMongoDB(): Promise<void> {
  if (global._mongooseConn) {
    await global._mongooseConn;
    return;
  }

  const dburl =
    (ME_CONFIG_MONGODB_URL.endsWith('/')
      ? ME_CONFIG_MONGODB_URL + DATABASE_NAME
      : ME_CONFIG_MONGODB_URL + '/' + DATABASE_NAME) + MONGODB_PARAMS;

  global._mongooseConn = mongoose.connect(dburl, {
    // Keep pool small — each Vercel container holds its own pool.
    // e.g. 20 concurrent containers × 5 = 100 connections (safe for M0's 500 limit).
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    await global._mongooseConn;
  } catch (err: any) {
    // Reset so the next cold-start can retry
    global._mongooseConn = undefined;
    console.error('Failed to connect to MongoDB', err);
  }
}
