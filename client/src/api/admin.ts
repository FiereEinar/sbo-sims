import adminAxiosInstance from './adminAxiosInstance';
import { Organization } from '@/types/organization';

export type AdminLoginBody = {
	studentID: string;
	password: string;
};

export type AdminOrgWithStats = Organization & { userCount: number };

/**
 * POST /auth/admin-login
 */
export async function adminLogin(body: AdminLoginBody) {
	const { data } = await adminAxiosInstance.post('/auth/admin-login', body);
	return data;
}

/**
 * GET /admin/organizations — all orgs with userCount
 */
export async function fetchAllOrgsAdmin(): Promise<AdminOrgWithStats[]> {
	const { data } = await adminAxiosInstance.get<{ data: AdminOrgWithStats[] }>(
		'/admin/organizations',
	);
	return data.data;
}

/**
 * POST /admin/organizations
 */
export async function adminCreateOrg(body: Partial<Organization>) {
	const { data } = await adminAxiosInstance.post('/admin/organizations', body);
	return data.data as Organization;
}

/**
 * PUT /admin/organizations/:id
 */
export async function adminUpdateOrg(id: string, body: Partial<Organization>) {
	const { data } = await adminAxiosInstance.put(
		`/admin/organizations/${id}`,
		body,
	);
	return data.data as Organization;
}

/**
 * DELETE /admin/organizations/:id
 */
export async function adminDeleteOrg(id: string) {
	const { data } = await adminAxiosInstance.delete(
		`/admin/organizations/${id}`,
	);
	return data.data as Organization;
}
