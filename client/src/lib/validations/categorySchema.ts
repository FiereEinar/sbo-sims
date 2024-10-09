import { z } from 'zod';

export const categorySchema = z.object({
	name: z.string().min(1, 'Category name must not be empty'),
	fee: z
		.string()
		.refine((val) => !Number.isNaN(parseInt(val, 10)), {
			message: 'Enter a valid amount',
		})
		.refine((val) => parseInt(val, 10) >= 0, {
			message: 'Please enter a non-negative number',
		}),
});
