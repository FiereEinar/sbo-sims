import { z } from 'zod';

export const eventSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
});
