import express from 'express';
import {
	loginValidation,
	adminLoginValidation,
	signupValidation,
} from '../middlewares/validations/userValidations';
import {
	admin,
	admin_login,
	check_auth,
	login,
	logout,
	refresh,
	signup,
	verify_email,
	get_public_organizations,
} from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimiter';

const router = express.Router();

router.get('/organizations', get_public_organizations);

router.post('/login', authLimiter, loginValidation, login);

router.post('/admin-login', authLimiter, adminLoginValidation, admin_login);

router.post('/signup', authLimiter, signupValidation, signup);

router.get('/verify-email', verify_email);

router.get('/refresh', refresh);

router.get('/logout', logout);

router.get('/check-auth', check_auth);

router.put('/admin', admin);

export default router;
