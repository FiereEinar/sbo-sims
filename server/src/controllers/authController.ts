import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { loginUserBody, signupUserBody } from '../types/user';
import cloudinary from '../utils/cloudinary';
import fs from 'fs/promises';
import { validationResult } from 'express-validator';
import CustomResponse from '../types/response';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import { validateEmail } from '../utils/utils';
import jwt from 'jsonwebtoken';
import student from '../models/student';
import { appCookieName } from '../constants';

/**
 * POST - user signup
 */
export const signup = asyncHandler(async (req: CustomRequest, res) => {
	const {
		firstname,
		lastname,
		password,
		bio,
		email,
		studentID,
	}: signupUserBody = req.body;

	let profileURL =
		'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp';
	let profilePublicID = 'user/al85leemxkrs2qwnqrvU';

	const salt = process.env.BCRYPT_SALT;
	if (!salt) throw new Error('Bcrypt salt not found');

	const hashedPassword = await bcrypt.hash(password, parseInt(salt));

	// create and save the user
	const user = new User({
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

	res.json(new CustomResponse(true, user, 'User signed up successfully'));
});

/**
 * POST - user login
 */
export const login = asyncHandler(async (req, res) => {
	const { studentID, password }: loginUserBody = req.body;

	const user = await User.findOne({ studentID: studentID }).exec();
	if (user === null) {
		res.json(new CustomResponse(false, null, `Incorrect Student ID`));
		return;
	}

	const match = await bcrypt.compare(password, user.password);
	if (!match) {
		res.json(new CustomResponse(false, null, 'Incorrect password'));
		return;
	}

	const secretKey = process.env.JWT_SECRET_KEY;
	if (!secretKey) throw new Error('JWT secret key not found');

	const token = jwt.sign({ studentID: user.studentID }, secretKey, {
		expiresIn: '1d',
	});

	user.token = token;
	await user.save();

	res.cookie(appCookieName, token, {
		httpOnly: true,
		sameSite: 'none',
		secure: true,
		maxAge: 1000 * 60 * 60 * 24, // 1 day
	});

	res.json(new CustomResponse(true, null, 'Login successfull'));
});

/**
 * GET - user logout
 */
export const logout = asyncHandler(async (req: CustomRequest, res) => {
	const token = req.cookies[appCookieName] as string;

	if (token === undefined) {
		res.sendStatus(204);
		return;
	}

	const user = await User.findOne({ token: token });
	if (user) {
		user.token = '';
		await user.save();
	}

	res.clearCookie(appCookieName, {
		httpOnly: true,
		sameSite: 'none',
		secure: true,
	});

	res.sendStatus(200);
});

/**
 * GET - check if authenticated
 */
export const check_auth = asyncHandler(async (req: CustomRequest, res) => {
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

		res.sendStatus(200);
	});
});
