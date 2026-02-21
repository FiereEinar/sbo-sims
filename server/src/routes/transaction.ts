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
import upload from '../utils/multer';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

router.get('/', transactionQueryFilter, get_all_transactions);

router.get(
	'/download/pdf',
	hasRole([MODULES.TRANSACTION_DOWNLOAD]),
	transactionQueryFilter,
	get_transaction_list_file,
);

router.get(
	'/download/csv',
	hasRole([MODULES.TRANSACTION_DOWNLOAD]),
	transactionQueryFilter,
	get_transaction_list_csv,
);

router.get('/dashboard-data', get_dashboard_data);

router.get(
	'/:transactionID',
	isValidMongooseId('transactionID', { from: 'params' }),
	get_transaction,
);

router.post(
	'/',
	hasRole([MODULES.TRANSACTION_CREATE]),
	createTransactionValidation,
	create_transaction,
);

router.post(
	'/import',
	hasRole([MODULES.TRANSACTION_IMPORT]),
	upload.single('excel_file'),
	import_transactions_excel,
);

router.post(
	'/import/preview',
	hasRole([MODULES.TRANSACTION_IMPORT]),
	upload.single('excel_file'),
	preview_transactions_excel,
);

router.put(
	'/:transactionID',
	hasRole([MODULES.TRANSACTION_UPDATE]),
	isValidMongooseId('transactionID', { from: 'params' }),
	createTransactionValidation,
	update_transaction,
);

router.put(
	'/:transactionID/amount',
	hasRole([MODULES.TRANSACTION_UPDATE]),
	isValidMongooseId('transactionID', { from: 'params' }),
	updateTransactionAmountValidation,
	update_transaction_amount,
);

router.delete(
	'/:transactionID',
	hasRole([MODULES.TRANSACTION_DELETE]),
	isValidMongooseId('transactionID', { from: 'params' }),
	delete_transaction,
);

export default router;
