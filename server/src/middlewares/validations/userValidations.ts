import { body, validationResult } from 'express-validator';
import { CustomRequest } from '../../types/request';
import { NextFunction, Response } from 'express';
import CustomResponse from '../../types/response';
import { validateEmail } from '../../utils/utils';
import { signupUserBody } from '../../types/user';
import User from '../../models/user';
import asyncHandler from 'express-async-handler';

const signupExtraValidation = asyncHandler(
	async (req: CustomRequest, res: Response, next: NextFunction) => {
		const { password, confirmPassword, email, studentID }: signupUserBody =
			req.body;

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

		const existingUser = await User.findOne({
			$or: [{ studentID: studentID }, { email: email }],
		}).exec();

		if (existingUser) {
			if (existingUser.studentID === studentID) {
				res.json(
					new CustomResponse(
						false,
						null,
						'Error in form validation',
						`A student with ID '${studentID}' already exist`
					)
				);
			} else {
				res.json(
					new CustomResponse(
						false,
						null,
						'Error in form validation',
						`A student with email '${email}' already exist`
					)
				);
			}
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
		.withMessage('First name must be 1-50 characters'),

	body('lastname')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be 1-50 characters'),

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
