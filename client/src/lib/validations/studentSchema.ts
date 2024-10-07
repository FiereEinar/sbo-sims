import { z } from 'zod';

export const studentSchema = z.object({
	studentID: z.string().min(1, 'Student ID must not be empty'),
	firstname: z.string().min(1, 'First name must not be empty'),
	lastname: z.string().min(1, 'Last name must not be empty'),
	email: z.string().optional(),
});
