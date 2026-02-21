import express from 'express';
import { updateUserValidation } from '../middlewares/validations/userValidations';
import {
	adminUpdateUser,
	createUser,
	deleteUser,
	getSingleUser,
	getUsers,
	updateUserPassword,
} from '../controllers/userController';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

router.get('/', getUsers);

router.get('/:userID', getSingleUser);

router.post('/', hasRole([MODULES.USER_CREATE]), createUser);

router.put(
	'/:userID/admin',
	hasRole([MODULES.USER_UPDATE]),
	isValidMongooseId('userID', { from: 'params' }),
	updateUserValidation,
	adminUpdateUser,
);

router.delete(
	'/:userID',
	hasRole([MODULES.USER_DELETE]),
	isValidMongooseId('userID', { from: 'params' }),
	deleteUser,
);

router.patch(
	'/:userID/password',
	isValidMongooseId('userID', { from: 'params' }),
	updateUserPassword,
);

export default router;
