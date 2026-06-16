import express from 'express';
import {
	get_summary_report,
	get_monthly_report,
	download_report_pdf,
} from '../controllers/reportController';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

// All report routes require at least TRANSACTION_READ
router.get('/summary', hasRole([MODULES.TRANSACTION_READ]), get_summary_report);
router.get('/monthly', hasRole([MODULES.TRANSACTION_READ]), get_monthly_report);
router.get(
	'/download/pdf',
	hasRole([MODULES.TRANSACTION_DOWNLOAD]),
	download_report_pdf
);

export default router;
