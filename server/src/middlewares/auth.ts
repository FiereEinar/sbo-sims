import asyncHandler from 'express-async-handler';
import { NextFunction, Response } from 'express';
import { accessTokenCookieName, AppErrorCodes } from '../constants';
import { UNAUTHORIZED } from '../constants/http';
import { verifyToken } from '../utils/jwt';
import CustomResponse from '../types/response';

export const auth = asyncHandler(
	async (req, res: Response, next: NextFunction) => {
		const throwUnauthorized = () => {
			res
				.status(UNAUTHORIZED)
				.json(
					new CustomResponse(
						false,
						null,
						'Unauthorized',
						AppErrorCodes.InvalidAccessToken
					)
				);
		};

		// get token from cookies
		const token = req.cookies[accessTokenCookieName] as string;

		// check if token is present
		if (token === undefined) {
			console.log('Token not found');
			throwUnauthorized();
			return;
		}

		const { error, payload } = verifyToken(token);

		if (error || !payload) {
			console.log('Token not verified');
			throwUnauthorized();
			return;
		}

		const user = await req.UserModel.findById(payload.userID as string);
		if (user === null) {
			console.log('User not found');
			throwUnauthorized();
			return;
		}

		req.currentUser = user;
		next();
	}
);
