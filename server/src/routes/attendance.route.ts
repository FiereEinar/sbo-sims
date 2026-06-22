import express from 'express';
import { MODULES } from '../constants/modules';
import {
  record_attendance,
  get_session_attendance,
} from '../controllers/attendance.controller';
import { hasRole } from '../middlewares/authentication/role';

const router = express.Router();

router.get('/session/:sessionId', hasRole([MODULES.EVENT_READ]), get_session_attendance);

router.post('/record', hasRole([MODULES.EVENT_UPDATE]), record_attendance);

export default router;
