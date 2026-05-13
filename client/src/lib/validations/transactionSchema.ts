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
	modeOfPayment: z.enum(['cash', 'gcash']).default('cash'),
	details: z.any(),
});

// Schema for add/batch mode — amount & categoryID are managed per-entry, not in the form
export const addModeFormSchema = z.object({
	studentID: z.string().min(1, 'Enter student ID'),
	date: z.string().optional(),
	description: z.string().optional(),
	modeOfPayment: z.enum(['cash', 'gcash']).default('cash'),
});

export const batchTransactionItemSchema = z.object({
	categoryID: z.string().min(1, 'Select a category'),
	amount: z
		.string()
		.refine((val) => !Number.isNaN(parseInt(val, 10)), {
			message: 'Enter a valid amount',
		})
		.refine((val) => parseInt(val, 10) > 0, {
			message: 'Please enter a non-negative number',
		}),
	details: z.any(),
});

export const batchTransactionSchema = z.object({
	studentID: z.string().min(1, 'Enter student ID'),
	date: z.string().optional(),
	description: z.string().optional(),
	modeOfPayment: z.enum(['cash', 'gcash']).default('cash'),
	items: z.array(batchTransactionItemSchema).min(1, 'Add at least one category'),
});
