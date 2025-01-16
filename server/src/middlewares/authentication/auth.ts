import asyncHandler from 'express-async-handler';
import { NextFunction, Response } from 'express';
import { accessTokenCookieName, AppErrorCodes } from '../../constants';
import { UNAUTHORIZED } from '../../constants/http';
import { verifyToken } from '../../utils/jwt';
import appAssert from '../../errors/appAssert';

export const auth = asyncHandler(
	async (req, res: Response, next: NextFunction) => {
		// get token from cookies and check if token is present
		const token = req.cookies[accessTokenCookieName] as string;
		appAssert(
			token,
			UNAUTHORIZED,
			'No token found',
			AppErrorCodes.InvalidAccessToken
		);

		const { error, payload } = verifyToken(token);
		appAssert(
			!error && payload,
			UNAUTHORIZED,
			'Token not verified',
			AppErrorCodes.InvalidAccessToken
		);

		const user = await req.UserModel.findById(payload.userID as string);
		appAssert(
			user,
			UNAUTHORIZED,
			'User not found',
			AppErrorCodes.InvalidAccessToken
		);

		req.currentUser = user;
		next();
	}
);
