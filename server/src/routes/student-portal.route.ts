import express from 'express';
import { authLimiter } from '../middlewares/rateLimiter';
import { loginValidation, signupValidation } from '../middlewares/validations/userValidations';
import {
  student_login,
  student_signup,
  get_student_dashboard,
} from '../controllers/student-portal.controller';
import { auth } from '../middlewares/authentication/auth';
import { studentAuth } from '../middlewares/authentication/studentAuth';

const router = express.Router();

// --- Public endpoints (no JWT required) ---
router.post('/signup', authLimiter, signupValidation, student_signup);
router.post('/login', authLimiter, loginValidation, student_login);

// --- Protected endpoints (require valid JWT + student role) ---
// auth is applied inline here because this router sits before the global auth middleware in app.ts
router.get('/dashboard', auth, studentAuth, get_student_dashboard);

export default router;
