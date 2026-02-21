import { Router } from 'express';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';
import {
	createRole,
	deleteRole,
	getRoles,
	getSingleRole,
	updateRole,
} from '../controllers/roleController';

const router = Router();

router.get('/', getRoles);

router.get('/:roleID', hasRole([MODULES.ROLE_READ]), getSingleRole);

router.post('/', hasRole([MODULES.ROLE_CREATE]), createRole);

router.patch('/:roleID', hasRole([MODULES.ROLE_UPDATE]), updateRole);

router.delete('/:roleID', hasRole([MODULES.ROLE_DELETE]), deleteRole);

export default router;
