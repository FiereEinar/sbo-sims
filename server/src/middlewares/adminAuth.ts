import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { NextFunction, Response } from 'express';

export const adminAuth = asyncHandler(
	async (req: CustomRequest, res: Response, next: NextFunction) => {
		const user = req.currentUser;

		if (user === undefined) {
			res.sendStatus(401);
			return;
		}

		if (user.role !== 'admin') {
			res.sendStatus(403);
			return;
		}

		next();
	}
);
