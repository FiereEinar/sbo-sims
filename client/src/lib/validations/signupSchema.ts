import { z } from 'zod';

export const signupSchema = z
	.object({
		firstname: z
			.string()
			.min(1, 'First name must not be empty')
			.max(50, 'First name must be under 50 characters'),

		lastname: z
			.string()
			.min(1, 'Last name must not be empty')
			.max(50, 'Last name must be under 50 characters'),

		password: z
			.string()
			.min(1, 'Password must not be empty')
			.max(30, 'Password must be under 30 characters'),

		confirmPassword: z
			.string()
			.min(1, 'Confirm password must not be empty')
			.max(30, 'Confirm password must be under 30 characters'),

		studentID: z
			.string()
			.refine((val) => parseInt(val).toString().length === 10, {
				message: 'Student ID must be 10 numbers to be valid',
			}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Password must match',
		path: ['confirmPassword'],
	});
