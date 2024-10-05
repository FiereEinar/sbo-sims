import express from 'express';
import {
	create_student,
	delete_student,
	get_all_students,
	get_student,
	update_student,
} from '../controllers/studentController';
import {
	createStudentValidation,
	updateStudentValidation,
} from '../middlewares/validations';

const router = express.Router();

router.get('/', get_all_students);
router.get('/:studentID', get_student);
router.post('/', createStudentValidation, create_student);
router.put('/:studentID', updateStudentValidation, update_student);
router.delete('/:studentID', delete_student);

export default router;
