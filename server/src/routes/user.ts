import express from 'express';
import { updateUserValidation } from '../middlewares/validations/userValidations';
import {
	adminUpdateUser,
	createUser,
	deleteUser,
	getSingleUser,
	getUsers,
	update_user,
} from '../controllers/userController';
import { isValidMongooseId } from '../middlewares/validations/validation';

const router = express.Router();

router.get('/', getUsers);

router.get('/:userID', getSingleUser);

router.post('/', createUser);

router.put(
	'/:userID/admin',
	isValidMongooseId('userID', { from: 'params' }),
	updateUserValidation,
	adminUpdateUser,
);

router.delete(
	'/:userID',
	isValidMongooseId('userID', { from: 'params' }),
	deleteUser,
);

export default router;
