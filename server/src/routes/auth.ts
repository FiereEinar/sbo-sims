import express from 'express';
import {
	loginValidation,
	signupValidation,
} from '../middlewares/validations/userValidations';
import { login, signup } from '../controllers/authController';

const router = express.Router();

router.post('/login', loginValidation, login);
router.post('/signup', signupValidation, signup);

export default router;
