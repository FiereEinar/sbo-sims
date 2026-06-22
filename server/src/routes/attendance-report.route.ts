import express from 'express';
import { get_attendance_summary } from '../controllers/attendance-report.controller';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

router.get('/summary', hasRole([MODULES.REPORT_READ]), get_attendance_summary);

export default router;
