import { z } from 'zod';

// 1. Define the base object schema containing only the raw fields
const eventBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  venue: z.string().min(1, 'Venue is required'),
  start: z
    .string()
    .datetime({ message: 'Invalid start date format' })
    .transform((val) => new Date(val)),
  end: z
    .string()
    .datetime({ message: 'Invalid end date format' })
    .transform((val) => new Date(val)),
});

// 2. Create the CREATE schema by refining the base schema
export const createEventSchema = eventBaseSchema.refine(
  (data) => data.end > data.start,
  {
    message: 'End date must be after start date',
    path: ['end'],
  },
);

// 3. Create the UPDATE schema by making the base partial FIRST, then applying refinement
export const updateEventSchema = eventBaseSchema.partial().refine(
  (data) => {
    // Only validate chronological order if BOTH dates are being provided in the update request
    if (data.start && data.end) {
      return data.end > data.start;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['end'],
  },
);

// Inferred Types remain exactly the same
export type CreateEventBody = z.infer<typeof createEventSchema>;
export type UpdateEventBody = z.infer<typeof updateEventSchema>;
