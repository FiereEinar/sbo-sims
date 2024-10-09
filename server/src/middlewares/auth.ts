import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { NextFunction, Response } from 'express';
import { appCookieName } from '../constants';
import jwt from 'jsonwebtoken';
import User from '../models/user';

export const auth = asyncHandler(
	async (req: CustomRequest, res: Response, next: NextFunction) => {
		const token = req.cookies[appCookieName] as string;

		if (token === undefined) {
			res.sendStatus(401);
			return;
		}

		const secretKey = process.env.JWT_SECRET_KEY;
		if (!secretKey) throw new Error('JWT secret key not found');

		jwt.verify(token, secretKey, async (err, payload) => {
			if (err) {
				res.sendStatus(403);
				return;
			}

			const data = payload as { studentID: string };

			const user = await User.findOne({ studentID: data.studentID });
			if (user === null) {
				res.sendStatus(403);
				return;
			}

			req.user = user;
			next();
		});
	}
);
