import { z } from 'zod';

export const transactionSchema = z.object({
	amount: z
		.string()
		.refine((val) => !Number.isNaN(parseInt(val, 10)), {
			message: 'Enter a valid amount',
		})
		.refine((val) => parseInt(val, 10) > 0, {
			message: 'Please enter a non-negative number',
		}),
	date: z.string().optional(),
	categoryID: z.string().optional(),
	studentID: z.string().min(1, 'Enter student ID'),
	description: z.string().optional(),
	details: z.any(),
});
