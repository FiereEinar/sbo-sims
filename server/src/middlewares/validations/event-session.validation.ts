import { z } from 'zod';

export const createEventSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  event: z.string().min(1, 'Event ID is required'),
});

export type CreateEventSessionBody = z.infer<typeof createEventSessionSchema>;

export const updateEventSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
});

export type UpdateEventSessionBody = z.infer<typeof updateEventSessionSchema>;

export const updateEventSessionStatusSchema = z.object({
  status: z.enum(['upcoming', 'active', 'completed', 'paused']),
});

export type UpdateEventSessionStatusBody = z.infer<typeof updateEventSessionStatusSchema>;
