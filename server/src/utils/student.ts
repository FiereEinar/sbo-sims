import UserModel from '../models/user.model';
import { STUDENT_EMAIL_DOMAIN } from '../constants/env';

/**
 * Resolves a student's email address in order of preference:
 * 1. Email stored on the Student document (if non-empty).
 * 2. Email stored on the student's User account (if registered and non-empty).
 * 3. Fallback to studentID + STUDENT_EMAIL_DOMAIN from .env (e.g. 2301106599@student.buksu.edu.ph).
 */
export const resolveStudentEmail = async (student: {
  studentID: string;
  email?: string | null;
}): Promise<string> => {
  if (student.email && student.email.trim().length > 0) {
    return student.email.trim();
  }

  try {
    const user = await UserModel.findOne({
      studentID: student.studentID,
      role: 'student',
    })
      .select('email')
      .lean();

    if (user?.email && user.email.trim().length > 0) {
      return user.email.trim();
    }
  } catch (error) {
    console.warn(
      `Could not look up student user email for student ID ${student.studentID}:`,
      error,
    );
  }

  const domain = STUDENT_EMAIL_DOMAIN || '@student.buksu.edu.ph';
  return `${student.studentID}${domain}`;
};

export const getStudentEmail = resolveStudentEmail;
