import { Transaction } from '@/types/transaction';
import axiosInstance from './axiosInstance';

export const fetchTransactions = async (): Promise<
	Transaction[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get('/transaction');

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch transaction', err);
	}
};
