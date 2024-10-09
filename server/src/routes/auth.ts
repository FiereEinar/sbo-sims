import express from 'express';
import { signupValidation } from '../middlewares/validations/userValidations';
import { signup } from '../controllers/authController';

const router = express.Router();

router.post('/signup', signupValidation, signup);

export default router;
