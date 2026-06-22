import express from 'express';
import { MODULES } from '../constants/modules';
import {
  record_attendance,
  get_session_attendance,
  download_session_attendance_pdf,
  download_session_attendance_csv,
} from '../controllers/attendance.controller';
import { hasRole } from '../middlewares/authentication/role';

const router = express.Router();

router.get('/session/:sessionId', hasRole([MODULES.ATTENDANCE_RECORD_READ]), get_session_attendance);

router.post('/record', hasRole([MODULES.ATTENDANCE_RECORD_CREATE]), record_attendance);

router.get('/session/:sessionId/download/pdf', hasRole([MODULES.ATTENDANCE_RECORD_DOWNLOAD]), download_session_attendance_pdf);

router.get('/session/:sessionId/download/csv', hasRole([MODULES.ATTENDANCE_RECORD_DOWNLOAD]), download_session_attendance_csv);

export default router;
