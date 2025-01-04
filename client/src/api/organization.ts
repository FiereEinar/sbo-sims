import { Organization, OrganizationWithCategory } from '@/types/organization';
import axiosInstance from './axiosInstance';
import { OrganizationFormValues } from '@/components/forms/AddOrganizationForm';
import { APIResponse } from '@/types/api-response';
import { CategoryWithTransactions } from '@/types/category';

export const fetchAllOrganizations = async (): Promise<
	OrganizationWithCategory[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get('/organization');

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const fetchOrganizationByID = async (
	organizationID: string
): Promise<Organization | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/organization/${organizationID}`);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const submitOrganizationForm = async (
	formData: OrganizationFormValues
): Promise<APIResponse<void> | undefined> => {
	try {
		const { data } = await axiosInstance.post('/organization', formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const fetchOrganizationCategories = async (
	organizationID: string
): Promise<CategoryWithTransactions[] | undefined> => {
	try {
		const { data } = await axiosInstance.get(
			`/organization/${organizationID}/categories`
		);

		return data.data;
	} catch (err: any) {
		throw err;
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
		throw err;
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
		throw err;
	}
};
