import express from 'express';
import { createCategoryValidation } from '../middlewares/validations/categoryValidations';
import {
	create_category,
	delete_category,
	get_all_category,
	get_all_category_with_transactions_data,
	get_category,
	get_category_transactions,
	update_category,
} from '../controllers/categoryController';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { transactionQueryFilter } from '../middlewares/transactions-filter';
import { authorizeRoles } from '../middlewares/authentication/authorizedRoles';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

router.get('/', get_all_category);

router.get('/with-transactions', get_all_category_with_transactions_data);

router.get(
	'/:categoryID',
	isValidMongooseId('categoryID', { from: 'params' }),
	transactionQueryFilter,
	get_category,
);

router.get(
	'/:categoryID/transaction',
	isValidMongooseId('categoryID', { from: 'params' }),
	get_category_transactions,
);

router.post(
	'/',
	hasRole([MODULES.CATEGORY_CREATE]),
	createCategoryValidation,
	create_category,
);

router.put(
	'/:categoryID',
	hasRole([MODULES.CATEGORY_UPDATE]),
	isValidMongooseId('categoryID', { from: 'params' }),
	createCategoryValidation,
	update_category,
);

router.delete(
	'/:categoryID',
	hasRole([MODULES.CATEGORY_DELETE]),
	isValidMongooseId('categoryID', { from: 'params' }),
	delete_category,
);

export default router;
