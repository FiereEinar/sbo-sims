import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { loginUserBody, signupUserBody } from '../types/user';
import CustomResponse from '../types/response';
import bcrypt from 'bcryptjs';
import {
	accessTokenCookieName,
	AppErrorCodes,
	refreshTokenCookieName,
} from '../constants';
import { validateEmail } from '../utils/utils';
import {
	BCRYPT_SALT,
	JWT_REFRESH_SECRET_KEY,
	SECRET_ADMIN_KEY,
} from '../constants/env';
import {
	BAD_REQUEST,
	CONFLICT,
	FORBIDDEN,
	NO_CONTENT,
	NOT_FOUND,
	OK,
	UNAUTHORIZED,
} from '../constants/http';
import {
	cookieOptions,
	getAccessTokenOptions,
	getRefreshTokenOptions,
	setAuthCookie,
} from '../utils/cookie';
import {
	RefreshTokenPayload,
	refreshTokenSignOptions,
	signToken,
	verifyToken,
} from '../utils/jwt';
import { ONE_DAY_MS, thirtyDaysFromNow } from '../utils/date';
import appAssert from '../errors/appAssert';

/**
 * POST - user signup
 */
export const signup = asyncHandler(async (req: CustomRequest, res) => {
	const {
		confirmPassword,
		password,
		email,
		studentID,
		firstname,
		lastname,
		bio,
	}: signupUserBody = req.body;

	// check if UserModel is attached to the request
	if (!req.UserModel) {
		throw new Error('UserModel not attached');
	}

	// check if passwords match
	appAssert(password === confirmPassword, BAD_REQUEST, 'Password must match');

	// check for errors in form validation
	if (email?.length) {
		appAssert(validateEmail(email), BAD_REQUEST, 'Email must be valid');
	}

	// check if studentID is valid
	appAssert(
		parseInt(studentID).toString().length === 10,
		BAD_REQUEST,
		`Student ID must be 10 numbers and should not contain characters to be valid`
	);

	// check if studentID already exist
	const existingUser = await req.UserModel.findOne({
		studentID: studentID,
	}).exec();

	appAssert(
		!existingUser,
		CONFLICT,
		`A user with ID '${studentID}' already exist`
	);

	// set default profile picture
	let profileURL =
		'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp';
	let profilePublicID = 'user/al85leemxkrs2qwnqrvU';

	// hash the password
	const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT));

	// create and save the user
	const user = new req.UserModel({
		firstname: firstname,
		lastname: lastname,
		studentID: studentID,
		password: hashedPassword,
		email: email,
		bio: bio,
		profile: {
			url: profileURL,
			publicID: profilePublicID,
		},
	});
	await user.save();

	// hide the password
	let userCopy = user.omitPassword();

	res.json(new CustomResponse(true, userCopy, 'User signed up successfully'));
});

/**
 * POST - user login
 */
export const login = asyncHandler(async (req: CustomRequest, res) => {
	const { studentID, password }: loginUserBody = req.body;

	if (!req.UserModel || !req.SessionModel) {
		throw new Error('UserModel or SessionModel not attached');
	}

	// check if studentID is valid
	const user = await req.UserModel.findOne({ studentID: studentID }).exec();
	appAssert(user, UNAUTHORIZED, `Incorrect Student ID`);

	// check if password is correct
	const match = await bcrypt.compare(password, user.password);
	appAssert(match, UNAUTHORIZED, 'Incorrect password');

	// create and save the session
	const session = new req.SessionModel({
		userID: user._id,
		expiresAt: thirtyDaysFromNow(),
	});
	await session.save();

	const sessionID = session._id as string;
	const userID = user._id as string;

	// create and set the access token and refresh token
	const accessToken = signToken({ sessionID, userID });
	const refreshToken = signToken({ sessionID }, refreshTokenSignOptions);
	setAuthCookie({ res, accessToken, refreshToken });

	res.json(
		new CustomResponse(
			true,
			{ user: user.omitPassword(), accessToken, refreshToken },
			'Login successfull'
		)
	);
});

/**
 * GET - user logout
 */
export const logout = asyncHandler(async (req: CustomRequest, res) => {
	const accessToken = req.cookies[accessTokenCookieName] as string;

	if (!req.SessionModel) {
		throw new Error('SessionModel not attached');
	}

	// check if token is present
	appAssert(accessToken, NO_CONTENT, 'No token');

	const { payload } = verifyToken(accessToken);

	if (payload) {
		await req.SessionModel.findByIdAndDelete({ _id: payload.sessionID });
	}

	// clear the cookie
	res.clearCookie(accessTokenCookieName, cookieOptions);

	res.sendStatus(OK);
});

/**
 * GET - refresh access token
 */
export const refresh = asyncHandler(async (req: CustomRequest, res) => {
	if (!req.SessionModel) {
		throw new Error('SessionModel not attached');
	}

	// get the refresh token
	const refreshToken = req.cookies[refreshTokenCookieName] as string;
	appAssert(refreshToken, UNAUTHORIZED, 'No refresh token found');

	// verify the refresh token
	const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
		secret: JWT_REFRESH_SECRET_KEY,
	});

	appAssert(payload, UNAUTHORIZED, 'Token did not return any payload');

	const session = await req.SessionModel.findById(payload.sessionID);
	const now = Date.now();

	// check if session is valid
	appAssert(
		session && session.expiresAt.getTime() > now,
		UNAUTHORIZED,
		'Session expired'
	);

	// check if session needs refresh
	const sessionNeedsRefresh = session.expiresAt.getTime() - now < ONE_DAY_MS;
	if (sessionNeedsRefresh) {
		session.expiresAt = thirtyDaysFromNow();
		await session.save();
	}

	// create and set the new access token and refresh token
	const newRefreshToken = sessionNeedsRefresh
		? signToken({ sessionID: session._id as string }, refreshTokenSignOptions)
		: undefined;

	const accessToken = signToken({
		sessionID: session._id as string,
		userID: session.userID as unknown as string,
	});

	if (newRefreshToken) {
		res.cookie(
			refreshTokenCookieName,
			newRefreshToken,
			getRefreshTokenOptions()
		);
	}

	res
		.status(OK)
		.cookie(accessTokenCookieName, accessToken, getAccessTokenOptions())
		.json(new CustomResponse(true, null, 'Token refreshed'));
});

/**
 * GET - check if authenticated
 */
export const check_auth = asyncHandler(async (req: CustomRequest, res) => {
	if (!req.UserModel || !req.SessionModel) {
		throw new Error('UserModel and SessionModel not attached');
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

	const token = req.cookies[accessTokenCookieName] as string;

	// check if token is present
	appAssert(
		token,
		UNAUTHORIZED,
		'Token not found',
		AppErrorCodes.InvalidAccessToken
	);

	// verify the token
	const { error, payload } = verifyToken(token);

	appAssert(
		!error && payload,
		UNAUTHORIZED,
		'Token not verified',
		AppErrorCodes.InvalidAccessToken
	);

	const user = await req.UserModel.findById(payload.userID as string);
	const session = await req.SessionModel.findById(payload.sessionID);

	appAssert(
		session && user,
		UNAUTHORIZED,
		'User or session not found',
		AppErrorCodes.InvalidAccessToken
	);

	res.status(OK).json(user.omitPassword());
});

export const admin = asyncHandler(async (req: CustomRequest, res) => {
	const { secretAdminKey, userID } = req.body;

	if (!req.UserModel) {
		throw new Error('UserModel not attached');
	}

	appAssert(
		secretAdminKey === SECRET_ADMIN_KEY,
		BAD_REQUEST,
		'Invalid admin key'
	);

	const user = await req.UserModel.findByIdAndUpdate(
		userID,
		{ role: 'admin' },
		{ new: true }
	);

	appAssert(user, NOT_FOUND, 'User not found');

	res.json(new CustomResponse(true, user.omitPassword(), 'Admin found'));
});
