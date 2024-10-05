import express from 'express';
import {
	create_transaction,
	delete_transaction,
	get_all_transactions,
	get_transaction,
} from '../controllers/transactionController';
import { createTransactionValidation } from '../middlewares/validations/transactionValidation';

const router = express.Router();

router.get('/', get_all_transactions);
router.get('/:transactionID', get_transaction);
router.post('/', createTransactionValidation, create_transaction);
router.delete('/:transactionID', delete_transaction);

export default router;
