import { z } from 'zod';

export const studentSchema = z.object({
	studentID: z.string().min(1, 'Student ID must not be empty'),
	firstname: z.string().min(1, 'First name must not be empty'),
	lastname: z.string().min(1, 'Last name must not be empty'),
	email: z.string().optional(),
	course: z.string().min(1, 'Course must not be empty'),
	gender: z.string().min(1, 'Gender must not be empty'),
	middlename: z.string().optional(),
	year: z
		.string()
		.refine((val) => !Number.isNaN(parseInt(val, 10)), {
			message: 'Enter a valid amount',
		})
		.refine((val) => parseInt(val, 10) > 0, {
			message: 'Please enter a non-negative number',
		}),
});
