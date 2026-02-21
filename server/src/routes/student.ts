import express from 'express';
import {
	create_student,
	delete_student,
	get_all_students,
	get_available_course,
	get_student,
	get_student_transaction,
	post_csv_students,
	preview_students_import,
	import_students_smart,
	update_student,
} from '../controllers/studentController';
import {
	createStudentValidation,
	updateStudentValidation,
} from '../middlewares/validations/studentValidation';
import upload from '../utils/multer';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

router.get('/', get_all_students);

router.get('/courses', get_available_course);

router.get('/:studentID', get_student);

router.get('/:studentID/transaction', get_student_transaction);

router.post(
	'/',
	hasRole([MODULES.STUDENT_CREATE]),
	createStudentValidation,
	create_student,
);

// Legacy import (exact CSV headers required)
router.post(
	'/import',
	hasRole([MODULES.STUDENT_IMPORT]),
	upload.single('csv_file'),
	post_csv_students,
);

// Smart import with preview (auto-detects columns)
router.post(
	'/import/preview',
	hasRole([MODULES.STUDENT_IMPORT]),
	upload.single('file'),
	preview_students_import,
);

router.post(
	'/import/smart',
	hasRole([MODULES.STUDENT_IMPORT]),
	upload.single('file'),
	import_students_smart,
);

router.put(
	'/:studentID',
	hasRole([MODULES.STUDENT_UPDATE]),
	updateStudentValidation,
	update_student,
);

router.delete('/:studentID', hasRole([MODULES.STUDENT_DELETE]), delete_student);

export default router;
