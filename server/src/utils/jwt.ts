import { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { JWT_REFRESH_SECRET_KEY, JWT_SECRET_KEY } from '../constants/env';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { accessTokenCookieName } from '../constants';

export type AccessTokenPayload = {
	sessionID: string;
	userID: string;
};

export type RefreshTokenPayload = {
	sessionID: string;
};

export type SignOptionsAndSecret = SignOptions & {
	secret: string;
};

export const accessTokenSignOptions: SignOptionsAndSecret = {
	expiresIn: '12h',
	secret: JWT_SECRET_KEY,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
	expiresIn: '30d',
	secret: JWT_REFRESH_SECRET_KEY,
};

export const getAccessToken = (req: Request) => {
	const cookieToken = req.cookies[accessTokenCookieName] as string;
	const headerToken = req.headers.authorization?.split(' ')[1];
	const token = cookieToken || headerToken;

	return token;
};

export const signToken = (
	payload: AccessTokenPayload | RefreshTokenPayload,
	options?: SignOptionsAndSecret
) => {
	const { secret, ...rest } = options || accessTokenSignOptions;
	return jwt.sign(payload, secret, rest);
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
	token: string,
	options?: VerifyOptions & { secret: string }
) => {
	const { secret, ...rest } = options || { secret: JWT_SECRET_KEY };
	try {
		const payload = jwt.verify(token, secret, rest) as TPayload;
		return { payload };
	} catch (error: any) {
		return { error: error.message };
	}
};
