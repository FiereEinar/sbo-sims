import express from 'express';
import { MODULES } from '../constants/modules';
import {
  create_event_session,
  delete_event_session,
  get_event_sessions,
  update_event_session,
} from '../controllers/event-session.controller';
import { hasRole } from '../middlewares/authentication/role';

const router = express.Router();

router.get('/', hasRole([MODULES.EVENT_READ]), get_event_sessions);

router.post('/', hasRole([MODULES.EVENT_CREATE]), create_event_session);

router.put('/:id', hasRole([MODULES.EVENT_UPDATE]), update_event_session);

router.delete('/:id', hasRole([MODULES.EVENT_DELETE]), delete_event_session);

export default router;
