import { body } from 'express-validator';

export const createOrganizationValidation = [
	body('name')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Category name must not be empty'),

	body('governor')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Governor name must not be empty')
		.toLowerCase(),

	body('treasurer')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Treasurer name must not be empty')
		.toLowerCase(),
];
