import express from 'express';
import {
  get_org_payment_requests,
  approve_payment_request,
  reject_payment_request,
} from '../controllers/payment-request.controller';
import { MODULES } from '../constants/modules';
import { hasRole } from '../middlewares/authentication/role';

const router = express.Router();

router.get('/', hasRole([MODULES.PAYMENT_REQUEST_READ]), get_org_payment_requests);

router.put(
  '/:id/approve',
  hasRole([MODULES.PAYMENT_REQUEST_UPDATE]),
  approve_payment_request,
);

router.put(
  '/:id/reject',
  hasRole([MODULES.PAYMENT_REQUEST_UPDATE]),
  reject_payment_request,
);

export default router;
