import express from 'express';
import {
	create_student,
	delete_student,
	get_all_students,
	get_student,
	get_student_transaction,
	update_student,
} from '../controllers/studentController';
import {
	createStudentValidation,
	updateStudentValidation,
} from '../middlewares/validations';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.get('/', auth, get_all_students);

router.get('/:studentID', get_student);

router.get('/:studentID/transaction', get_student_transaction);

router.post('/', auth, createStudentValidation, create_student);

router.put('/:studentID', auth, updateStudentValidation, update_student);

router.delete('/:studentID', auth, delete_student);

export default router;
