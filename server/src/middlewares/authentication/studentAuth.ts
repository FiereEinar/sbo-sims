import { RequestHandler } from 'express';
import { FORBIDDEN, UNAUTHORIZED } from '../../constants/http';

/**
 * Middleware that restricts access to users with role === 'student'.
 * Used to gate all student-portal data endpoints.
 */
export const studentAuth: RequestHandler = (req, res, next) => {
  const user = req.currentUser;

  if (!user) {
    res.sendStatus(UNAUTHORIZED);
    return;
  }

  if (user.role !== 'student') {
    res.status(FORBIDDEN).json({ message: 'Access restricted to students only.' });
    return;
  }

  next();
};
