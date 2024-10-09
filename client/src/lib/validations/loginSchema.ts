import { z } from 'zod';

export const loginSchema = z.object({
	studentID: z
		.string()
		.refine((val) => parseInt(val).toString().length === 10, {
			message: 'Student ID must be 10 numbers to be valid',
		}),
	password: z
		.string()
		.min(1, 'Password must not be empty')
		.max(30, 'Password must be under 30 characters'),
});
