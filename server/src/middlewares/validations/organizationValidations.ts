import { body } from 'express-validator';

export const createOrganizationValidation = [
	body('name')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Category name must not be empty'),
];
