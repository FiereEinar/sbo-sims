import { body } from 'express-validator';

export const createStudentValidation = [
	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('studentID must not be empty'),

	body('firstname')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('First name must not be empty')
		.toLowerCase(),

	body('lastname')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Last name must not be empty')
		.toLowerCase(),

	body('email').trim().escape().optional(),
];

export const updateStudentValidation = [
	body('firstname')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('First name must not be empty')
		.toLowerCase(),

	body('lastname')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Last name must not be empty')
		.toLowerCase(),

	body('email').trim().escape().optional(),
];
