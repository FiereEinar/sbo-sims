import express from 'express';
import {
  get_org_payment_requests,
  approve_payment_request,
  reject_payment_request,
} from '../controllers/payment-request.controller';
import { MODULES } from '../constants/modules';
import { hasRole } from '../middlewares/authentication/role';
import { logOperation } from '../middlewares/operation-log.middleware';

const router = express.Router();

router.get('/', hasRole([MODULES.PAYMENT_REQUEST_READ]), get_org_payment_requests);

router.put(
  '/:id/approve',
  hasRole([MODULES.PAYMENT_REQUEST_UPDATE]),
  approve_payment_request,
  logOperation('PaymentRequest'),
);

router.put(
  '/:id/reject',
  hasRole([MODULES.PAYMENT_REQUEST_UPDATE]),
  reject_payment_request,
  logOperation('PaymentRequest'),
);

export default router;
