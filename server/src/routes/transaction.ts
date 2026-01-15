import express from 'express';
import {
	create_transaction,
	delete_transaction,
	get_all_transactions,
	get_dashboard_data,
	get_transaction,
	get_transaction_list_csv,
	get_transaction_list_file,
	import_transactions_excel,
	preview_transactions_excel,
	update_transaction,
	update_transaction_amount,
} from '../controllers/transactionController';
import {
	createTransactionValidation,
	updateTransactionAmountValidation,
} from '../middlewares/validations/transactionValidation';
import { transactionQueryFilter } from '../middlewares/transactions-filter';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { authorizeRoles } from '../middlewares/authentication/authorizedRoles';
import upload from '../utils/multer';

const router = express.Router();

router.get('/', transactionQueryFilter, get_all_transactions);

router.get(
	'/download/pdf',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	transactionQueryFilter,
	get_transaction_list_file
);

router.get(
	'/download/csv',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	transactionQueryFilter,
	get_transaction_list_csv
);

router.get('/dashboard-data', get_dashboard_data);

router.get(
	'/:transactionID',
	isValidMongooseId('transactionID', { from: 'params' }),
	get_transaction
);

router.post(
	'/',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	createTransactionValidation,
	create_transaction
);

router.post(
	'/import',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	upload.single('excel_file'),
	import_transactions_excel
);

router.post(
	'/import/preview',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	upload.single('excel_file'),
	preview_transactions_excel
);

router.put(
	'/:transactionID',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	isValidMongooseId('transactionID', { from: 'params' }),
	createTransactionValidation,
	update_transaction
);

router.put(
	'/:transactionID/amount',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	isValidMongooseId('transactionID', { from: 'params' }),
	updateTransactionAmountValidation,
	update_transaction_amount
);

router.delete(
	'/:transactionID',
	authorizeRoles('governor', 'treasurer', 'auditor'),
	isValidMongooseId('transactionID', { from: 'params' }),
	delete_transaction
);

export default router;
