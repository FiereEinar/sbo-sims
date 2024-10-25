import axiosInstance from '@/api/axiosInstance';
import { generateTransactionsFilterURL } from '@/api/transaction';
import { TransactionsFilterValues } from '@/types/transaction';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const handleDownloadTransactions = async (
	filters: TransactionsFilterValues
) => {
	try {
		const { course, date, category, status, period } = filters;

		const url = generateTransactionsFilterURL(
			{ course, date, category, status, period },
			`/transaction/download?page=1`
		);

		const result = await axiosInstance.get(url, {
			responseType: 'blob',
		});

		// Create a URL for the blob and trigger the download
		const blob = new Blob([result.data], { type: 'text/csv' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'transactions.csv';
		link.click();
	} catch (err: any) {
		console.error('Error downloading the file: ', err);
	}
};
