import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  venue: z.string().min(1, 'Venue is required'),
  start: z.coerce.date({
    required_error: "Start date is required",
    invalid_type_error: "That's not a date!",
  }),
  end: z.coerce.date({
    required_error: "End date is required",
    invalid_type_error: "That's not a date!",
  }),
});
