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
} from '../controllers/authController';

const router = express.Router();

router.post('/login', loginValidation, login);

router.post('/signup', signupValidation, signup);

router.get('/refresh', refresh);

router.get('/logout', logout);

router.get('/check-auth', check_auth);

router.put('/admin', admin);

export default router;
