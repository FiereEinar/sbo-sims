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
import {
	createStudentValidation,
	updateStudentValidation,
} from '../middlewares/validations/studentValidation';

const router = express.Router();

router.get('/', get_all_students);

router.get('/courses', get_available_course);

// router.get('/load-students', load_all_students);

router.get('/:studentID', get_student);

router.get('/:studentID/transaction', get_student_transaction);

router.post('/', createStudentValidation, create_student);

router.put('/:studentID', updateStudentValidation, update_student);

router.delete('/:studentID', delete_student);

export default router;
