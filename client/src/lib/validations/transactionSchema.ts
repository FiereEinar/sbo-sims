import { z } from 'zod';

export const transactionSchema = z.object({
	amount: z.string().refine((val) => !Number.isNaN(parseInt(val, 10)), {
		message: 'Expected number, received a string',
	}),
	date: z.date().optional(),
	categoryID: z.string().optional(),
	studentID: z.string().min(1, 'Enter student ID'),
	description: z.string().optional(),
});
