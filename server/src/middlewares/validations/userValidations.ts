import { body } from 'express-validator';
import { isFormBodyValidated } from './validation';

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

	isFormBodyValidated,
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
