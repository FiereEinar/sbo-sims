import { body, validationResult } from 'express-validator';
import { CustomRequest } from '../../types/request';
import { NextFunction, Response } from 'express';
import CustomResponse from '../../types/response';
import { validateEmail } from '../../utils/utils';
import { signupUserBody } from '../../types/user';
import asyncHandler from 'express-async-handler';
import { isFormBodyValidated } from './validation';

const signupExtraValidation = asyncHandler(
	async (req: CustomRequest, res: Response, next: NextFunction) => {
		const {
			firstname,
			lastname,
			bio,
			password,
			confirmPassword,
			email,
			studentID,
		}: signupUserBody = req.body;

		if (!req.UserModel) {
			res
				.status(500)
				.json(new CustomResponse(false, null, 'UserModel not attached'));

			return;
		}

		// check for errors in form validation
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.json(
				new CustomResponse(
					false,
					null,
					'Error in form validation',
					errors.array()[0].msg
				)
			);
			return;
		}

		if (password !== confirmPassword) {
			res.json(
				new CustomResponse(
					false,
					null,
					'Error in form validation',
					'Passwords must match'
				)
			);
			return;
		}

		if (email?.length && !validateEmail(email)) {
			res.json(
				new CustomResponse(
					false,
					null,
					'Error in form validation',
					'Email must be valid'
				)
			);
			return;
		}

		if (parseInt(studentID).toString().length !== 10) {
			res.json(
				new CustomResponse(
					false,
					null,
					'Error in form validation',
					`Student ID must be 10 numbers and should not contain characters to be valid`
				)
			);
			return;
		}

		const existingUser = await req.UserModel.findOne({
			studentID: studentID,
		}).exec();

		if (existingUser) {
			res.json(
				new CustomResponse(
					false,
					null,
					'Error in form validation',
					`A user with ID '${studentID}' already exist`
				)
			);
			return;
		}

		next();
	}
);

export const signupValidation = [
	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 10, max: 10 })
		.withMessage('Student IDs are only 10 numbers in length'),

	body('firstname')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be 1-50 characters')
		.toLowerCase(),

	body('lastname')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be 1-50 characters')
		.toLowerCase(),

	body('password')
		.trim()
		.isLength({ min: 1, max: 30 })
		.withMessage('Password must be 1-30 characters'),

	body('confirmPassword')
		.trim()
		.isLength({ min: 1, max: 30 })
		.withMessage('Password must be 1-30 characters'),

	body('bio')
		.trim()
		.escape()
		.isLength({ max: 255 })
		.withMessage('Bio is only 255 characters max')
		.optional(),

	body('email').trim().escape().optional(),

	signupExtraValidation,
];

export const loginValidation = [
	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 10, max: 10 })
		.withMessage('Student IDs are only 10 numbers in length'),

	body('password')
		.trim()
		.isLength({ min: 1, max: 30 })
		.withMessage('Password must be 1-30 characters'),
];

export const updateUserValidation = [
	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 10, max: 10 })
		.withMessage('Student IDs are only 10 numbers in length'),

	body('firstname')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be 1-50 characters')
		.toLowerCase(),

	body('lastname')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be 1-50 characters')
		.toLowerCase(),

	body('bio')
		.trim()
		.escape()
		.isLength({ max: 255 })
		.withMessage('Bio is only 255 characters max')
		.optional(),

	body('email').trim().escape().optional(),

	body('activeSchoolYearDB')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('School year must not be empty'),

	body('activeSemDB')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('School semester must not be empty'),

	isFormBodyValidated,
];
