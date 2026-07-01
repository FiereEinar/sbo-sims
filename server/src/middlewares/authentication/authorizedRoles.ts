import { RequestHandler } from 'express';
import { FORBIDDEN, UNAUTHORIZED } from '../../constants/http';
import { UserRoles } from '../../models/user.model';

export const authorizeRoles =
  (...roles: UserRoles[]): RequestHandler =>
  (req, res, next) => {
    const user = req.currentUser;

    if (!user) {
      res.sendStatus(UNAUTHORIZED);
      return;
    }

    // the central admin will not have any restriction on this platform.
    if (user.role === 'central-admin') return next();

    if (!roles.includes(user.role as UserRoles)) {
      res.sendStatus(FORBIDDEN);
      return;
    }

    next();
  };
