import express from 'express';
import {
  create_student,
  delete_student,
  get_all_students,
  get_available_course,
  get_available_section,
  get_student,
  get_student_transaction,
  post_csv_students,
  preview_students_import,
  import_students_smart,
  update_student,
  get_sync_sources,
  sync_students,
} from '../controllers/student.controller';
import {
  createStudentValidation,
  updateStudentValidation,
} from '../middlewares/validations/studentValidation';
import upload from '../utils/multer';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';
import { logOperation } from '../middlewares/operation-log.middleware';

const router = express.Router();

router.get('/', get_all_students);

router.get('/courses', get_available_course);

router.get('/sections', get_available_section);

router.get(
  '/sync-sources',
  hasRole([MODULES.STUDENT_IMPORT]),
  get_sync_sources,
);
router.post('/sync', hasRole([MODULES.STUDENT_IMPORT]), sync_students);

router.get('/:studentID', get_student);

router.get('/:studentID/transaction', get_student_transaction);

router.post(
  '/',
  hasRole([MODULES.STUDENT_CREATE]),
  createStudentValidation,
  logOperation('Student'),
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
  logOperation('Student'),
  update_student,
);

router.delete('/:studentID', hasRole([MODULES.STUDENT_DELETE]), logOperation('Student'), delete_student);

export default router;
