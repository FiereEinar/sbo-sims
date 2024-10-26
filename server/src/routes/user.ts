import express from 'express';
import { updateUserValidation } from '../middlewares/validations/userValidations';
import { update_user } from '../controllers/userController';
import { isValidMongooseId } from '../middlewares/validations/validation';

const router = express.Router();

router.put(
	'/:userID',
	isValidMongooseId('userID', { from: 'params' }),
	updateUserValidation,
	update_user
);

export default router;
