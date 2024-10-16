import { Organization } from '@/types/organization';
import axiosInstance from './axiosInstance';
import { OrganizationFormValues } from '@/components/forms/AddOrganizationForm';
import { APIResponse } from '@/types/api-response';

export const fetchAllOrganizations = async (): Promise<
	Organization[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get('/organization');

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch all organizations', err);
	}
};

export const submitOrganizationForm = async (
	formData: OrganizationFormValues
): Promise<APIResponse | undefined> => {
	try {
		const { data } = await axiosInstance.post('/organization', formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit create organization form', err);
	}
};
