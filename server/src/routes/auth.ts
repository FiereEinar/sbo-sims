import express from 'express';
import {
	loginValidation,
	signupValidation,
} from '../middlewares/validations/userValidations';
import {
	admin,
	check_auth,
	login,
	logout,
	refresh,
	signup,
	verify_email,
} from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

router.post('/login', authLimiter, loginValidation, login);

router.post('/signup', authLimiter, signupValidation, signup);

router.get('/verify-email', verify_email);

router.get('/refresh', refresh);

router.get('/logout', logout);

router.get('/check-auth', check_auth);

router.put('/admin', admin);

export default router;
