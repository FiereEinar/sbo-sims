import express from 'express';
import {
	get_all_students,
	get_student,
} from '../controllers/studentController';

const router = express.Router();

router.get('/', get_all_students);
router.get('/:studentID', get_student);

export default router;
