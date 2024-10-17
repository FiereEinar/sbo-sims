import express from 'express';
import {
	create_organization,
	delete_organization,
	get_all_organizations,
	get_organization,
	get_organization_categories,
} from '../controllers/organizationController';
import { createOrganizationValidation } from '../middlewares/validations/organizationValidations';

const router = express.Router();

router.get('/', get_all_organizations);

router.get('/:organizationID', get_organization);

router.get('/:organizationID/categories', get_organization_categories);

router.post('/', createOrganizationValidation, create_organization);

router.delete('/:organizationID', delete_organization);

export default router;
