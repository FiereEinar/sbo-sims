import { z } from 'zod';

export const organizationSchema = z.object({
	name: z.string().min(1, 'Organization name must not be empty'),
	governor: z.string().min(1, 'Organization name must not be empty'),
	treasurer: z.string().min(1, 'Organization name must not be empty'),
});
