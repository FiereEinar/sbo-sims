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

router.get('/:roleID', getSingleRole);

router.post('/', createRole);

router.patch('/:roleID', updateRole);

router.delete('/:roleID', deleteRole);

export default router;
