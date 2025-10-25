import { z } from 'zod';

export const prelistingSchema = z.object({
	date: z.string().optional(),
	categoryID: z.string().optional(),
	studentID: z.string().min(1, 'Enter student ID'),
	description: z.string().optional(),
	details: z.any(),
});
