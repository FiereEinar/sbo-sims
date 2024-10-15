import { Organization } from '@/types/organization';
import axiosInstance from './axiosInstance';

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
