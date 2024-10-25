import express from 'express';
import {
	create_student,
	delete_student,
	get_all_students,
	get_available_course,
	get_student,
	get_student_transaction,
	load_all_students,
	update_student,
} from '../controllers/studentController';
import { auth } from '../middlewares/auth';
import {
	createStudentValidation,
	updateStudentValidation,
} from '../middlewares/validations/studentValidation';

const router = express.Router();

router.get('/', auth, get_all_students);

router.get('/courses', auth, get_available_course);

// router.get('/load-students', load_all_students);

router.get('/:studentID', auth, get_student);

router.get('/:studentID/transaction', auth, get_student_transaction);

router.post('/', auth, createStudentValidation, create_student);

router.put('/:studentID', auth, updateStudentValidation, update_student);

router.delete('/:studentID', auth, delete_student);

export default router;
