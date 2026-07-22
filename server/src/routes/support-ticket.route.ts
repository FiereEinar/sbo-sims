import express from 'express';
import {
  create_ticket,
  get_org_tickets,
  get_org_ticket,
  reply_ticket_org,
} from '../controllers/support-ticket.controller';

const router = express.Router();

router.post('/', create_ticket);
router.get('/', get_org_tickets);
router.get('/:id', get_org_ticket);
router.post('/:id/reply', reply_ticket_org);

export default router;
