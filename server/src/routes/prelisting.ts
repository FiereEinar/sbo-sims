import express from 'express';
import {
	create_prelisting,
	delete_prelisting,
	get_all_prelistings,
	get_prelisting,
	update_prelisting,
} from '../controllers/prelistingController';
import { prelistingQueryFilter } from '../middlewares/prelisting-filter';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { createPrelistingValidation } from '../middlewares/validations/prelistingValidation';
import { authorizeRoles } from '../middlewares/authentication/authorizedRoles';

const router = express.Router();

router.get('/', prelistingQueryFilter, get_all_prelistings);

router.get(
	'/:prelistingID',
	isValidMongooseId('prelistingID', { from: 'params' }),
	get_prelisting
);

router.post(
	'/',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	createPrelistingValidation,
	create_prelisting
);

router.put(
	'/:prelistingID',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	isValidMongooseId('prelistingID', { from: 'params' }),
	createPrelistingValidation,
	update_prelisting
);

router.delete(
	'/:prelistingID',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	isValidMongooseId('prelistingID', { from: 'params' }),
	delete_prelisting
);

export default router;
