import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { signupUserBody } from '../types/user';
import cloudinary from '../utils/cloudinary';
import fs from 'fs/promises';
import { validationResult } from 'express-validator';
import CustomResponse from '../types/response';
import User from '../models/user';
import bcrypt from 'bcryptjs';
import { validateEmail } from '../utils/utils';

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
	// await user.save();

	res.json(new CustomResponse(true, user, 'User signed up successfully'));
});
