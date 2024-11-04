import { z } from 'zod';

export const updateUserSchema = z.object({
	studentID: z
		.string()
		.refine((val) => parseInt(val).toString().length === 10, {
			message: 'Student ID must be 10 numbers to be valid',
		}),

	firstname: z
		.string()
		.min(1, 'First name must not be empty')
		.max(50, 'First name must be under 50 characters'),

	lastname: z
		.string()
		.min(1, 'Last name must not be empty')
		.max(50, 'Last name must be under 50 characters'),

	email: z.string().optional(),

	bio: z.string().max(100, 'Bio must only be under 100 characters'),
});
