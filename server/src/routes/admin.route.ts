import express from 'express';
import {
  admin_get_all_organizations,
  admin_create_organization,
  admin_update_organization,
  admin_delete_organization,
  admin_reset_onboarding,
} from '../controllers/admin.controller';
import {
  get_admin_tickets,
  update_ticket_status,
  get_admin_ticket,
  reply_ticket_admin,
} from '../controllers/support-ticket.controller';
import { isSuperAdmin } from '../middlewares/authentication/isSuperAdmin';
import { isValidMongooseId } from '../middlewares/validations/validation';
import {
  createOrganizationValidation,
  adminCreateOrganizationValidation,
} from '../middlewares/validations/organizationValidations';

const router = express.Router();

// All routes in this file are protected by isSuperAdmin
router.use(isSuperAdmin);

router.get('/organizations', admin_get_all_organizations);

router.post(
  '/organizations',
  adminCreateOrganizationValidation,
  admin_create_organization,
);

router.put(
  '/organizations/:organizationID',
  isValidMongooseId('organizationID', { from: 'params' }),
  createOrganizationValidation,
  admin_update_organization,
);

router.delete(
  '/organizations/:organizationID',
  isValidMongooseId('organizationID', { from: 'params' }),
  admin_delete_organization,
);

router.put(
  '/organizations/:organizationID/reset-onboarding',
  isValidMongooseId('organizationID', { from: 'params' }),
  admin_reset_onboarding,
);

router.get('/support-tickets', get_admin_tickets);
router.get('/support-tickets/:id', get_admin_ticket);
router.patch('/support-tickets/:id', update_ticket_status);
router.post('/support-tickets/:id/reply', reply_ticket_admin);

export default router;
