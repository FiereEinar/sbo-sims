import express from 'express';
import {
	create_organization,
	delete_organization,
	get_all_organizations,
	get_organization,
	get_organization_categories,
	update_organization,
} from '../controllers/organizationController';
import { createOrganizationValidation } from '../middlewares/validations/organizationValidations';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { authorizeRoles } from '../middlewares/authentication/authorizedRoles';

const router = express.Router();

router.get('/', get_all_organizations);

router.get(
	'/:organizationID',
	isValidMongooseId('organizationID', { from: 'params' }),
	get_organization
);

router.get(
	'/:organizationID/categories',
	isValidMongooseId('organizationID', { from: 'params' }),
	get_organization_categories
);

router.post(
	'/',
	authorizeRoles('governor'),
	createOrganizationValidation,
	create_organization
);

router.delete(
	'/:organizationID',
	authorizeRoles('governor'),
	isValidMongooseId('organizationID', { from: 'params' }),
	delete_organization
);

router.put(
	'/:organizationID',
	authorizeRoles('governor'),
	isValidMongooseId('organizationID', { from: 'params' }),
	createOrganizationValidation,
	update_organization
);

export default router;
