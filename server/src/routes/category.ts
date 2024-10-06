import express from 'express';
import { createCategoryValidation } from '../middlewares/validations/categoryValidations';
import {
	create_category,
	delete_category,
	get_all_category,
	get_category,
	get_category_transactions,
	update_category,
} from '../controllers/categoryController';

const router = express.Router();

router.get('/', get_all_category);

router.get('/:categoryID', get_category);

router.get('/:categoryID/transaction', get_category_transactions);

router.post('/', createCategoryValidation, create_category);

router.put('/:categoryID', createCategoryValidation, update_category);

router.delete('/:categoryID', delete_category);

export default router;
