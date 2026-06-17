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

/**
 * Validation for creating an organization from the super admin portal.
 * Extends createOrganizationValidation with the seeded admin account fields.
 */
export const adminCreateOrganizationValidation = [
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

	body('governor').trim().escape().isLength({ min: 1 }).withMessage('Governor name must not be empty').toLowerCase(),
	body('viceGovernor').trim().escape().isLength({ min: 1 }).withMessage('Vice governor name must not be empty').toLowerCase(),
	body('treasurer').trim().escape().isLength({ min: 1 }).withMessage('Treasurer name must not be empty').toLowerCase(),
	body('auditor').trim().escape().isLength({ min: 1 }).withMessage('Auditor name must not be empty').toLowerCase(),

	body('departments').isArray(),

	// Seeded admin account credentials
	body('adminStudentID')
		.trim()
		.escape()
		.isLength({ min: 10, max: 10 })
		.withMessage('Admin Student ID must be exactly 10 characters'),

	body('adminPassword')
		.trim()
		.isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })
		.withMessage('Admin password must be at least 8 characters with uppercase, lowercase, and a number')
		.isLength({ max: 100 })
		.withMessage('Admin password must be max 100 characters'),

	body('adminFirstname')
		.trim()
		.escape()
		.isLength({ min: 1, max: 50 })
		.withMessage('Admin first name must be 1-50 characters'),

	body('adminLastname')
		.trim()
		.escape()
		.isLength({ min: 1, max: 50 })
		.withMessage('Admin last name must be 1-50 characters'),

	isFormBodyValidated,
];
