import { CorsOptions } from 'cors';
import { ALLOWED_ORIGINS, FRONTEND_URL } from '../constants/env';

// Remove trailing slash if present to avoid CORS mismatch
const normalizedOrigin = FRONTEND_URL.replace(/\/$/, '');
const origins = ALLOWED_ORIGINS.split(',');

const allowedOrigins = [normalizedOrigin, ...origins];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, electron, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-active-sem',
    'x-active-school-year',
    'x-organization-slug',
    'x-sync-secret',
  ],
};
