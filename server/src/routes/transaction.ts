import express from 'express';
import {
	create_transaction,
	delete_transaction,
	get_all_transactions,
	get_transaction,
	update_transaction,
	update_transaction_amount,
} from '../controllers/transactionController';
import {
	createTransactionValidation,
	updateTransactionAmountValidation,
} from '../middlewares/validations/transactionValidation';

const router = express.Router();

router.get('/', get_all_transactions);

router.get('/:transactionID', get_transaction);

router.post('/', createTransactionValidation, create_transaction);

router.put('/:transactionID', createTransactionValidation, update_transaction);

router.put(
	'/:transactionID/amount',
	updateTransactionAmountValidation,
	update_transaction_amount
);

router.delete('/:transactionID', delete_transaction);

export default router;
