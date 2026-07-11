import express from 'express';
import { authLimiter } from '../middlewares/rateLimiter';
import {
  loginValidation,
  signupValidation,
} from '../middlewares/validations/userValidations';
import {
  student_login,
  student_signup,
  get_student_dashboard,
} from '../controllers/student-portal.controller';
import {
  create_payment_request,
  get_student_payment_requests,
} from '../controllers/payment-request.controller';
import { upload } from '../middlewares/upload';
import { auth } from '../middlewares/authentication/auth';
import { studentAuth } from '../middlewares/authentication/studentAuth';

const router = express.Router();

router.post('/signup', authLimiter, signupValidation, student_signup);
router.post('/login', authLimiter, loginValidation, student_login);
router.get('/dashboard', auth, studentAuth, get_student_dashboard);

// Payment Requests
router.post(
  '/payment-request',
  auth,
  studentAuth,
  upload.single('receiptImage'),
  create_payment_request,
);
router.get(
  '/payment-request',
  auth,
  studentAuth,
  get_student_payment_requests,
);

export default router;
