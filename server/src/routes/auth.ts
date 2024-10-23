import express from 'express';
import {
	loginValidation,
	signupValidation,
} from '../middlewares/validations/userValidations';
import {
	check_auth,
	login,
	logout,
	signup,
} from '../controllers/authController';
import path from 'path';

const router = express.Router();

router.post('/login', loginValidation, login);

router.post('/signup', signupValidation, signup);

router.get('/logout', logout);

router.get('/check-auth', check_auth);

router.get('/file', (req, res) => {
	const filePath = path.join(
		__dirname,
		'../',
		'students',
		'STUDENTS_LIST_BSIT.csv'
	);
	console.log(filePath);
	res.sendFile(filePath);
});

export default router;
