import express from 'express';
import {
  get_summary_report,
  get_monthly_report,
  download_report_pdf,
} from '../controllers/report.controller';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

router.get('/summary', hasRole([MODULES.REPORT_READ]), get_summary_report);
router.get('/monthly', hasRole([MODULES.REPORT_READ]), get_monthly_report);
router.get(
  '/download/pdf',
  hasRole([MODULES.REPORT_DOWNLOAD]),
  download_report_pdf,
);

export default router;
