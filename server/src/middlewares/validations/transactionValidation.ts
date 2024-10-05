import { body } from 'express-validator';

export const createTransactionValidation = [
	body('amount').isNumeric(),

	body('categoryID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Category ID must not be empty'),

	body('date')
		.trim()
		.isDate()
		.withMessage('Date must be a valid date')
		.optional(),

	body('description').trim().escape().optional(),

	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Student ID must not be empty'),
];
