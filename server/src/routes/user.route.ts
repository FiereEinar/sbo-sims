import express from 'express';
import {
  updateUserValidation,
  updateUserPasswordValidation,
} from '../middlewares/validations/userValidations';
import {
  adminUpdateUser,
  createUser,
  deleteUser,
  getSingleUser,
  getUsers,
  updateUserPassword,
  update_user,
} from '../controllers/user.controller';
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

router.put(
  '/:userID',
  isValidMongooseId('userID', { from: 'params' }),
  updateUserValidation,
  update_user,
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
  updateUserPasswordValidation,
  updateUserPassword,
);

export default router;
