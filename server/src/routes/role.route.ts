import { Router } from 'express';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';
import { logOperation } from '../middlewares/operation-log.middleware';
import {
  createRole,
  deleteRole,
  getRoles,
  getSingleRole,
  updateRole,
} from '../controllers/role.controller';

const router = Router();

router.get('/', getRoles);

router.get('/:roleID', hasRole([MODULES.ROLE_READ]), getSingleRole);

router.post(
  '/',
  hasRole([MODULES.ROLE_CREATE]),
  logOperation('Role'),
  createRole,
);

router.patch(
  '/:roleID',
  hasRole([MODULES.ROLE_UPDATE]),
  logOperation('Role'),
  updateRole,
);

router.delete(
  '/:roleID',
  hasRole([MODULES.ROLE_DELETE]),
  logOperation('Role'),
  deleteRole,
);

export default router;
