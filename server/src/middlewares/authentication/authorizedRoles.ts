import { RequestHandler } from 'express';
import { FORBIDDEN, UNAUTHORIZED } from '../../constants/http';
import { UserRoles } from '../../models/user';

export const authorizeRoles =
	(...roles: UserRoles[]): RequestHandler =>
	(req, res, next) => {
		const user = req.currentUser;

		if (!user) {
			res.sendStatus(UNAUTHORIZED);
			return;
		}

		if (!roles.includes(user.role as UserRoles)) {
			res.sendStatus(FORBIDDEN);
			return;
		}

		next();
	};
