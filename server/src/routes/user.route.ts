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
  completeOnboarding,
} from '../controllers/user.controller';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';
import { logOperation } from '../middlewares/operation-log.middleware';

const router = express.Router();

router.get('/', getUsers);

router.get('/:userID', getSingleUser);

router.put('/complete-onboarding', completeOnboarding);

router.post('/', hasRole([MODULES.USER_CREATE]), createUser, logOperation('User'));

router.put(
  '/:userID/admin',
  hasRole([MODULES.USER_UPDATE]),
  isValidMongooseId('userID', { from: 'params' }),
  updateUserValidation,
  adminUpdateUser,
  logOperation('User'),
);

router.put(
  '/:userID',
  isValidMongooseId('userID', { from: 'params' }),
  updateUserValidation,
  update_user,
  logOperation('User'),
);

router.delete(
  '/:userID',
  hasRole([MODULES.USER_DELETE]),
  isValidMongooseId('userID', { from: 'params' }),
  deleteUser,
  logOperation('User'),
);

router.patch(
  '/:userID/password',
  isValidMongooseId('userID', { from: 'params' }),
  updateUserPasswordValidation,
  updateUserPassword,
);

export default router;
