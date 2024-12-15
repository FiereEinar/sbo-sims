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
import { adminAuth } from '../middlewares/adminAuth';
import upload from '../utils/multer';

const router = express.Router();

router.get('/', get_all_students);

router.get('/courses', get_available_course);

router.get('/:studentID', get_student);

router.get('/:studentID/transaction', get_student_transaction);

router.post('/', adminAuth, createStudentValidation, create_student);

router.post('/import', adminAuth, upload.single('csv_file'), post_csv_students);

router.put('/:studentID', adminAuth, updateStudentValidation, update_student);

router.delete('/:studentID', adminAuth, delete_student);

export default router;
