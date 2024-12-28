import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { NextFunction, Response } from 'express';
import { accessTokenCookieName, AppErrorCodes } from '../constants';
import { FORBIDDEN, UNAUTHORIZED } from '../constants/http';
import { verifyToken } from '../utils/jwt';
import CustomResponse from '../types/response';

export const auth = asyncHandler(
	async (req: CustomRequest, res: Response, next: NextFunction) => {
		if (!req.UserModel) {
			throw new Error('UserModel not attached');
		}

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
			throwUnauthorized();
			return;
		}

		const { error, payload } = verifyToken(token);

		if (error || !payload) {
			throwUnauthorized();
			return;
		}

		const user = await req.UserModel.findById(payload.userID as string);
		if (user === null) {
			throwUnauthorized();
			return;
		}

		req.currentUser = user;
		next();
	}
);
