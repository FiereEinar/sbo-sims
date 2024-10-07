import { Transaction } from '@/types/transaction';
import axiosInstance from './axiosInstance';
import { APIResponse } from '@/types/api-response';
import { TransactionFormValues } from '@/components/forms/AddTransactionForm';

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

export const submitTransactionForm = async (
	formData: TransactionFormValues
): Promise<APIResponse | undefined> => {
	try {
		const { data } = await axiosInstance.post('/transaction', formData);

		return data;
	} catch (err: any) {
		console.error('Failed to fetch transaction', err);
	}
};

export const fetchTransactionByID = async (
	transactionID: string
): Promise<Transaction | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/transaction/${transactionID}`);

		return data.data;
	} catch (err: any) {
		console.error(`Failed to fetch transaction with ID ${transactionID}`, err);
	}
};
