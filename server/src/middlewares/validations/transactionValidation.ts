import { body } from 'express-validator';
import { isFormBodyValidated, isValidMongooseId } from './validation';

export const createTransactionValidation = [
	body('amount').isNumeric().toInt(),

	body('categoryID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Category ID must not be empty'),

	body('date').optional().toDate(),

	body('description').trim().escape().optional(),

	body('studentID')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Student ID must not be empty'),

	isValidMongooseId('categoryID', { from: 'body' }),

	isFormBodyValidated,
];

export const updateTransactionAmountValidation = [
	body('amount').isNumeric().toInt(),

	isFormBodyValidated,
];
