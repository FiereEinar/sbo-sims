import expressAsyncHandler from 'express-async-handler';
import appAssert from '../../errors/appAssert';
import { FORBIDDEN } from '../../constants/http';

/**
 * Middleware that restricts access to users with role 'central-admin' (the global super admin).
 * This does NOT require a tenant context.
 */
export const isSuperAdmin = expressAsyncHandler(async (req, _res, next) => {
	const user = req.currentUser;
	appAssert(user, 401, 'Not authenticated');
	appAssert(
		user.role === 'central-admin',
		FORBIDDEN,
		'Access denied: Super Admin only',
	);
	next();
});
