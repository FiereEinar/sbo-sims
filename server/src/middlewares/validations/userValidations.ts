import { body } from 'express-validator';

export const signupValidation = [
	body('firstname')
		.trim()
		.escape()
		.toLowerCase()
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be 1-50 characters'),
];
