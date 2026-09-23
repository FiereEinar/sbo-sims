import { RequestHandler } from 'express';
import { NODE_ENV } from '../constants/env';
import { seedAdmin } from '../database/seedAdmin';

let isSeeded = false;

/**
 * Middleware that ensures the admin account is seeded once on initial request
 * (bypassed in test environment).
 */
export const ensureAdminSeeded: RequestHandler = async (_req, _res, next) => {
  if (NODE_ENV !== 'test' && !isSeeded) {
    try {
      await seedAdmin();
      isSeeded = true;
    } catch (err) {
      console.error('[seed] Startup error:', err);
    }
  }
  next();
};
