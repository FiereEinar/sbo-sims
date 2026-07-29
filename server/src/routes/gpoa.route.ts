import express from 'express';
import {
  create_gpoa,
  delete_gpoa,
  get_all_gpoa,
  get_single_gpoa,
  update_gpoa,
} from '../controllers/gpoa.controller';
import { MODULES } from '../constants/modules';
import { auth } from '../middlewares/authentication/auth';
import { extractTenantContext } from '../middlewares/attach-database-models';
import { hasRole } from '../middlewares/authentication/role';

const router = express.Router();

router.use(auth);
router.use(extractTenantContext);

router.post('/', hasRole([MODULES.GPOA_CREATE]), create_gpoa);
router.get('/', hasRole([MODULES.GPOA_READ]), get_all_gpoa);
router.get('/:id', hasRole([MODULES.GPOA_READ]), get_single_gpoa);
router.put('/:id', hasRole([MODULES.GPOA_UPDATE]), update_gpoa);
router.patch('/:id', hasRole([MODULES.GPOA_UPDATE]), update_gpoa);
router.delete('/:id', hasRole([MODULES.GPOA_DELETE]), delete_gpoa);

export default router;
