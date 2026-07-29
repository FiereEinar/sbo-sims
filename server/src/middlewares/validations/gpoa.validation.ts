import { z } from 'zod';

export const createGpoaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  targetDate: z
    .string()
    .datetime({ message: 'Invalid target date format' })
    .transform((val) => new Date(val)),
  venue: z.string().min(1, 'Venue is required'),
  budget: z.number().min(0, 'Budget cannot be negative'),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
});

export const updateGpoaSchema = createGpoaSchema.partial();

export type CreateGpoaBody = z.infer<typeof createGpoaSchema>;
export type UpdateGpoaBody = z.infer<typeof updateGpoaSchema>;
