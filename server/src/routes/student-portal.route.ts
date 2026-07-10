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
import { auth } from '../middlewares/authentication/auth';
import { studentAuth } from '../middlewares/authentication/studentAuth';

const router = express.Router();

router.post('/signup', authLimiter, signupValidation, student_signup);
router.post('/login', authLimiter, loginValidation, student_login);
router.get('/dashboard', auth, studentAuth, get_student_dashboard);

export default router;
