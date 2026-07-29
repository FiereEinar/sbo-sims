import { z } from 'zod';

export const gpoaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  targetDate: z.date({
    required_error: 'Target date is required',
    invalid_type_error: 'That is not a valid date',
  }),
  venue: z.string().min(1, 'Venue is required'),
  budget: z.coerce.number().min(0, 'Budget must be a positive number'),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
});

export type GpoaFormValues = z.infer<typeof gpoaSchema>;
