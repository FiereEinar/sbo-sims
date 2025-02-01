import asyncHandler from 'express-async-handler';
import { NextFunction, Response } from 'express';
import { accessTokenCookieName, AppErrorCodes } from '../../constants';
import { UNAUTHORIZED } from '../../constants/http';
import { getAccessToken, verifyToken } from '../../utils/jwt';
import appAssert from '../../errors/appAssert';
import { getUserRequestInfo } from '../../utils/utils';

export const auth = asyncHandler(
	async (req, res: Response, next: NextFunction) => {
		const token = getAccessToken(req);
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

		const session = await req.SessionModel.findById(payload.sessionID);
		appAssert(
			session,
			UNAUTHORIZED,
			'Session not found',
			AppErrorCodes.InvalidAccessToken
		);

		const now = Date.now();
		if (session.expiresAt.getTime() < now) {
			await req.SessionModel.findByIdAndDelete(session._id);
			appAssert(
				false,
				UNAUTHORIZED,
				'Session expired',
				AppErrorCodes.InvalidAccessToken
			);
		}

		const { ip, userAgent } = getUserRequestInfo(req);
		appAssert(
			ip === session.ip && userAgent === session.userAgent,
			UNAUTHORIZED,
			'Invalid session',
			AppErrorCodes.InvalidAccessToken
		);

		req.currentUser = user;
		next();
	}
);
