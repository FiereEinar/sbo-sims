import { body } from 'express-validator';
import { isFormBodyValidated } from './validation';

export const createOrganizationValidation = [
	body('name')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Organization name must not be empty'),

	body('slug')
		.trim()
		.escape()
		.matches(/^[a-z0-9-]+$/)
		.withMessage('Slug must only contain lowercase alphanumeric characters and hyphens')
		.isLength({ min: 1 })
		.withMessage('Organization slug must not be empty')
		.toLowerCase(),

	body('governor')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Governor name must not be empty')
		.toLowerCase(),

	body('viceGovernor')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Vice governor name must not be empty')
		.toLowerCase(),

	body('treasurer')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Treasurer name must not be empty')
		.toLowerCase(),

	body('auditor')
		.trim()
		.escape()
		.isLength({ min: 1 })
		.withMessage('Auditor name must not be empty')
		.toLowerCase(),

	body('departments').isArray(),

	isFormBodyValidated,
];
