import express from 'express';
import {
	create_student,
	delete_student,
	get_all_students,
	get_available_course,
	get_student,
	get_student_transaction,
	post_csv_students,
	update_student,
} from '../controllers/studentController';
import {
	createStudentValidation,
	updateStudentValidation,
} from '../middlewares/validations/studentValidation';
import { adminAuth } from '../middlewares/authentication/adminAuth';
import upload from '../utils/multer';
import { authorizeRoles } from '../middlewares/authentication/authorizedRoles';

const router = express.Router();

router.get('/', get_all_students);

router.get('/courses', get_available_course);

router.get('/:studentID', get_student);

router.get('/:studentID/transaction', get_student_transaction);

router.post(
	'/',
	authorizeRoles('governor', 'treasurer'),
	createStudentValidation,
	create_student
);

router.post(
	'/import',
	authorizeRoles('governor', 'treasurer'),
	upload.single('csv_file'),
	post_csv_students
);

router.put(
	'/:studentID',
	authorizeRoles('governor', 'treasurer'),
	updateStudentValidation,
	update_student
);

router.delete(
	'/:studentID',
	authorizeRoles('governor', 'treasurer'),
	delete_student
);

export default router;
