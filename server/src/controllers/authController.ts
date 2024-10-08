import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { signupUserBody } from '../types/user';
import cloudinary from '../utils/cloudinary';
import fs from 'fs/promises';

export const signup = asyncHandler(async (req: CustomRequest, res) => {
	const {
		firstname,
		lastname,
		password,
		confirmPassword,
		bio,
		email,
		studentID,
	}: signupUserBody = req.body;

	let defaultProfileURL = '';
	let defaultProfilePublicID = '';

	// if (req.file) {
	// 	const result = await cloudinary.uploader.upload(req.file.path);

	// 	defaultProfileURL = result.secure_url;
	// 	defaultProfilePublicID = result.public_id;

	// 	await fs.unlink(req.file.path);
	// }
});
