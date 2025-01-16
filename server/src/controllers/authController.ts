import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import appAssert from '../errors/appAssert';
import CustomResponse from '../types/response';
import { loginUserBody, signupUserBody } from '../types/user';
import { ONE_DAY_MS, thirtyDaysFromNow } from '../utils/date';
import { validateEmail } from '../utils/utils';
import {
	accessTokenCookieName,
	AppErrorCodes,
	refreshTokenCookieName,
} from '../constants';
import {
	BCRYPT_SALT,
	JWT_REFRESH_SECRET_KEY,
	SECRET_ADMIN_KEY,
} from '../constants/env';
import {
	BAD_REQUEST,
	CONFLICT,
	NO_CONTENT,
	NOT_FOUND,
	OK,
	UNAUTHORIZED,
} from '../constants/http';
import {
	cookieOptions,
	getAccessTokenOptions,
	getRefreshTokenOptions,
	REFRESH_PATH,
	setAuthCookie,
} from '../utils/cookie';
import {
	RefreshTokenPayload,
	refreshTokenSignOptions,
	signToken,
	verifyToken,
} from '../utils/jwt';

/**
 * POST - user signup
 */
export const signup = asyncHandler(async (req, res) => {
	const {
		confirmPassword,
		password,
		email,
		studentID,
		firstname,
		lastname,
		bio,
	}: signupUserBody = req.body;

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
export const login = asyncHandler(async (req, res) => {
	const { studentID, password }: loginUserBody = req.body;

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
			{ user: user.omitPassword(), accessToken },
			'Login successfull'
		)
	);
});

/**
 * GET - user logout
 */
export const logout = asyncHandler(async (req, res) => {
	const accessToken = req.cookies[accessTokenCookieName] as string;

	// check if token is present
	appAssert(accessToken, NO_CONTENT, 'No token');

	const { payload } = verifyToken(accessToken);

	if (payload) {
		await req.SessionModel.findByIdAndDelete({ _id: payload.sessionID });
	}

	// clear the cookie
	res.clearCookie(accessTokenCookieName, cookieOptions);
	res.clearCookie(refreshTokenCookieName, {
		...cookieOptions,
		path: REFRESH_PATH,
	});

	res.sendStatus(OK);
});

/**
 * GET - refresh access token
 */
export const refresh = asyncHandler(async (req, res) => {
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
export const check_auth = asyncHandler(async (req, res) => {
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

export const admin = asyncHandler(async (req, res) => {
	const { secretAdminKey, userID } = req.body;

	appAssert(
		secretAdminKey === SECRET_ADMIN_KEY,
		BAD_REQUEST,
		'Invalid admin key'
	);

	const user = await req.UserModel.findByIdAndUpdate(
		userID,
		{ role: 'governor' },
		{ new: true }
	);

	appAssert(user, NOT_FOUND, 'User not found');

	res.json(new CustomResponse(true, user.omitPassword(), 'Admin found'));
});
