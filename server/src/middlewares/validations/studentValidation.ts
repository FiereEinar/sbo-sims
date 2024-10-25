import { body } from 'express-validator';
import { isFormBodyValidated } from './validation';

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

	body('course')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Course must not be empty')
		.toUpperCase(),

	body('gender')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Gender must not be empty')
		.toUpperCase(),

	body('year').toInt().isInt(),

	body('email').trim().escape().optional(),

	body('middlename').trim().escape().optional(),

	isFormBodyValidated,
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

	isFormBodyValidated,
];
