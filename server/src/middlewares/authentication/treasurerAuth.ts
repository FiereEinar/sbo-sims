import { RequestHandler } from 'express';
import { FORBIDDEN, UNAUTHORIZED } from '../../constants/http';

export const governorAuth: RequestHandler = (req, res, next) => {
	const user = req.currentUser;

	if (user === undefined) {
		res.sendStatus(UNAUTHORIZED);
		return;
	}

	if (
		user.role !== 'governor' ||
		user.role !== 'treasurer' ||
		user.role !== 'auditor'
	) {
		res.sendStatus(FORBIDDEN);
		return;
	}

	next();
};
