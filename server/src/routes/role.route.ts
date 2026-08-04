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

router.post('/', hasRole([MODULES.ROLE_CREATE]), createRole, logOperation('Role'));

router.patch('/:roleID', hasRole([MODULES.ROLE_UPDATE]), updateRole, logOperation('Role'));

router.delete('/:roleID', hasRole([MODULES.ROLE_DELETE]), deleteRole, logOperation('Role'));

export default router;
