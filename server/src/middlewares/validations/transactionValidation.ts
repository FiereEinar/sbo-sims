import { body } from 'express-validator';

export const createTransactionValidation = [
	body('amount').isNumeric().toInt(),

	body('categoryID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Category ID must not be empty'),

	body('date')
		.optional()
		.isISO8601()
		.toDate()
		.withMessage('Date must be a valid date'),

	body('description').trim().escape().optional(),

	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Student ID must not be empty'),
];

export const updateTransactionAmountValidation = [
	body('amount').isNumeric().toInt(),
];
