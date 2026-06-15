import { z } from 'zod';

export const organizationSchema = z.object({
	name: z.string().min(1, 'Organization name must not be empty'),
	slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens').min(1, 'Slug must not be empty'),
	governor: z.string().min(1, 'Governor must not be empty'),
	viceGovernor: z.string().min(1, 'Vice Governor must not be empty'),
	treasurer: z.string().min(1, 'Treasurer name must not be empty'),
	auditor: z.string().min(1, 'Auditor name must not be empty'),
	departments: z.array(z.string()).optional(), // backend will validate this
});
