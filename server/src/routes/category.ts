import express from 'express';
import { createCategoryValidation } from '../middlewares/validations/categoryValidations';
import {
	create_category,
	get_all_category,
	get_category,
} from '../controllers/categoryController';

const router = express.Router();

router.get('/', get_all_category);
router.get('/:categoryID', get_category);
router.post('/', createCategoryValidation, create_category);

export default router;
