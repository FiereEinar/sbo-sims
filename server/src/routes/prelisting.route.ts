import express from 'express';
import {
  create_prelisting,
  delete_prelisting,
  get_all_prelistings,
  get_prelisting,
  update_prelisting,
} from '../controllers/prelisting.controller';
import { prelistingQueryFilter } from '../middlewares/prelisting-filter';
import { isValidMongooseId } from '../middlewares/validations/validation';
import { createPrelistingValidation } from '../middlewares/validations/prelistingValidation';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';
import { logOperation } from '../middlewares/operation-log.middleware';

const router = express.Router();

router.get('/', prelistingQueryFilter, get_all_prelistings);

router.get(
  '/:prelistingID',
  isValidMongooseId('prelistingID', { from: 'params' }),
  get_prelisting,
);

router.post(
  '/',
  hasRole([MODULES.PRELISTING_CREATE]),
  createPrelistingValidation,
  create_prelisting,
  logOperation('Prelisting'),
);

router.put(
  '/:prelistingID',
  hasRole([MODULES.PRELISTING_UPDATE]),
  isValidMongooseId('prelistingID', { from: 'params' }),
  createPrelistingValidation,
  update_prelisting,
  logOperation('Prelisting'),
);

router.delete(
  '/:prelistingID',
  hasRole([MODULES.PRELISTING_DELETE]),
  isValidMongooseId('prelistingID', { from: 'params' }),
  delete_prelisting,
  logOperation('Prelisting'),
);

export default router;
