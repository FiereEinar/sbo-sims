import { Organization, OrganizationWithCategory } from '@/types/organization';
import axiosInstance from './axiosInstance';
import { OrganizationFormValues } from '@/components/forms/AddOrganizationForm';
import { APIResponse } from '@/types/api-response';
import { Category } from '@/types/category';

export const fetchAllOrganizations = async (): Promise<
	OrganizationWithCategory[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get('/organization');

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch all organizations', err);
	}
};

export const fetchOrganizationByID = async (
	organizationID: string
): Promise<Organization | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/organization/${organizationID}`);

		return data.data;
	} catch (err: any) {
		console.error(
			`Failed to fetch organization with ID ${organizationID}`,
			err
		);
	}
};

export const submitOrganizationForm = async (
	formData: OrganizationFormValues
): Promise<APIResponse<void> | undefined> => {
	try {
		const { data } = await axiosInstance.post('/organization', formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit create organization form', err);
	}
};

export const fetchOrganizationCategories = async (
	organizationID: string
): Promise<Category[] | undefined> => {
	try {
		const { data } = await axiosInstance.get(
			`/organization/${organizationID}/categories`
		);

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch organizations categories', err);
	}
};

export const requestDeleteOrganization = async (
	organizationID: string
): Promise<APIResponse<Organization> | undefined> => {
	try {
		const { data } = await axiosInstance.delete(
			`/organization/${organizationID}`
		);

		return data;
	} catch (err: any) {
		console.error('Failed to send request to delete organization', err);
	}
};

export const submitUpdateOrganizationForm = async (
	organizationID: string,
	formData: OrganizationFormValues
): Promise<APIResponse<Organization> | undefined> => {
	try {
		const { data } = await axiosInstance.put(
			`/organization/${organizationID}`,
			formData
		);

		return data;
	} catch (err: any) {
		console.error('Failed to submit update organization form', err);
	}
};
