import expressAsyncHandler from 'express-async-handler';
import { SECRET_ADMIN_KEY } from '../../constants/env';
import { UNAUTHORIZED } from '../../constants/http';
import appAssert from '../../errors/appAssert';

/**
 * Middleware that verifies the x-sync-secret header matches SECRET_ADMIN_KEY.
 * Used to protect sync engine and Atlas force-sync routes.
 */
export const syncSecretAuth = expressAsyncHandler(async (req, _res, next) => {
  const syncSecret = req.headers['x-sync-secret'];
  appAssert(
    syncSecret === SECRET_ADMIN_KEY,
    UNAUTHORIZED,
    'Invalid sync secret',
  );
  next();
});

export const requireSyncSecret = syncSecretAuth;
