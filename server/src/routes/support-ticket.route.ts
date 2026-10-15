import express from 'express';
import {
  create_ticket,
  get_org_tickets,
  get_org_ticket,
  reply_ticket_org,
} from '../controllers/support-ticket.controller';
import { logOperation } from '../middlewares/operation-log.middleware';

const router = express.Router();

router.post('/', create_ticket, logOperation('SupportTicket'));
router.get('/', get_org_tickets);
router.get('/:id', get_org_ticket);
router.post('/:id/reply', reply_ticket_org, logOperation('SupportTicket'));

export default router;
