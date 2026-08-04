import express from 'express';
import { MODULES } from '../constants/modules';
import {
  create_event_session,
  delete_event_session,
  get_event_sessions,
  update_event_session,
  update_event_session_status,
} from '../controllers/event-session.controller';
import { hasRole } from '../middlewares/authentication/role';
import { logOperation } from '../middlewares/operation-log.middleware';

const router = express.Router();

router.get('/', hasRole([MODULES.EVENT_READ]), get_event_sessions);

router.post('/', hasRole([MODULES.EVENT_CREATE]), create_event_session, logOperation('EventSession'));

router.put('/:id', hasRole([MODULES.EVENT_UPDATE]), update_event_session, logOperation('EventSession'));

router.patch('/:id/status', hasRole([MODULES.EVENT_UPDATE]), update_event_session_status, logOperation('EventSession'));

router.delete('/:id', hasRole([MODULES.EVENT_DELETE]), delete_event_session, logOperation('EventSession'));

export default router;
