import { APIPaginatedResponse, APIResponse } from '@/types/api-response';
import { Prelisting, PrelistingFilterValues } from '@/types/prelisting';
import axiosInstance from './axiosInstance';
import { PrelistingFormValues } from '@/components/forms/AddPrelistingForm';

export const generatePrelistingFilterURL = (
	filters: PrelistingFilterValues,
	baseURL: string
): string => {
	const defaultFilterValue = 'All';

	filters.course =
		filters.course === defaultFilterValue ? undefined : filters.course;
	filters.category =
		filters.category === defaultFilterValue ? undefined : filters.category;

	let url = `${baseURL}`;
	if (filters.search) url += `&search=${filters.search}`;
	if (filters.course) url += `&course=${filters.course}`;
	if (filters.startDate) url += `&startDate=${filters.startDate.toISOString()}`;
	if (filters.endDate) url += `&endDate=${filters.endDate.toISOString()}`;
	if (filters.category) url += `&category=${filters.category}`;

	return url;
};

export const fetchPrelistings = async (
	filters: PrelistingFilterValues,
	page: number = 1,
	pageSize: number = 50
): Promise<APIPaginatedResponse<Prelisting[]> | undefined> => {
	try {
		const url = generatePrelistingFilterURL(
			filters,
			`/prelisting?page=${page}&pageSize=${pageSize}`
		);

		const { data } = await axiosInstance.get<
			APIPaginatedResponse<Prelisting[]>
		>(url);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitPrelistingForm = async (
	formData: PrelistingFormValues
): Promise<APIResponse<Prelisting> | undefined> => {
	try {
		const { data } = await axiosInstance.post('/prelisting', formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitUpdatePrelistingForm = async (
	prelistingID: string,
	formData: PrelistingFormValues
): Promise<APIResponse<Prelisting> | undefined> => {
	try {
		const { data } = await axiosInstance.put(
			`/prelisting/${prelistingID}`,
			formData
		);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const fetchPrelistingByID = async (
	prelistingID: string | undefined
): Promise<Prelisting | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/prelisting/${prelistingID}`);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const requestDeletePrelisting = async (
	prelistingID: string
): Promise<APIResponse<Prelisting> | undefined> => {
	try {
		const { data } = await axiosInstance.delete(`/prelisting/${prelistingID}`);

		return data;
	} catch (err: any) {
		throw err;
	}
};
