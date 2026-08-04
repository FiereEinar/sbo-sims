import mongoose from 'mongoose';
import {
  CLOUD_CONFIG_MONGODB_URL,
  CLOUD_MONGODB_PARAMS,
  DATABASE_NAME,
} from '../constants/env';

let atlasConn: mongoose.Connection | undefined;

/**
 * Returns a cached Mongoose connection to MongoDB Atlas.
 * Used exclusively by the sync push/pull endpoints — never by regular app routes.
 * Regular app routes continue using ME_CONFIG_MONGODB_URL (local mongod.exe).
 */
export const getAtlasConnection = async (): Promise<mongoose.Connection> => {
  if (atlasConn && atlasConn.readyState === 1) {
    return atlasConn;
  }

  if (!CLOUD_CONFIG_MONGODB_URL) {
    throw new Error(
      'CLOUD_CONFIG_MONGODB_URL is not configured. Cannot connect to Atlas.',
    );
  }

  const url =
    (CLOUD_CONFIG_MONGODB_URL.endsWith('/')
      ? CLOUD_CONFIG_MONGODB_URL + DATABASE_NAME
      : CLOUD_CONFIG_MONGODB_URL + '/' + DATABASE_NAME) + CLOUD_MONGODB_PARAMS;

  atlasConn = mongoose.createConnection(url, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  });

  // Propagate connection errors so the sync engine can handle them gracefully
  atlasConn.on('error', (err) => {
    console.error('[AtlasConnection] Connection error:', err.message);
    atlasConn = undefined; // reset so next call retries
  });

  atlasConn.on('disconnected', () => {
    console.warn('[AtlasConnection] Disconnected from Atlas');
    atlasConn = undefined;
  });

  await atlasConn.asPromise();
  return atlasConn;
};
