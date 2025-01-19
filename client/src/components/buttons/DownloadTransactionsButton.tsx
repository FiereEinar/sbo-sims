import axiosInstance from '@/api/axiosInstance';
import { generateTransactionsFilterURL } from '@/api/transaction';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useState } from 'react';
import { Button } from '../ui/button';

export default function DownloadTransactionsButton() {
	const { search, category, course, startDate, endDate, period, status } =
		useTransactionFilterStore((state) => state);
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownloadTransactions = async () => {
		try {
			setIsDownloading(true);
			const url = generateTransactionsFilterURL(
				{ search, course, startDate, endDate, category, status, period },
				`/transaction/download?page=1`
			);

			const result = await axiosInstance.get(url, {
				responseType: 'blob',
			});

			const blob = new Blob([result.data], { type: 'application/pdf' });
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'transactions.pdf';
			link.click();
		} catch (err: any) {
			console.error('Error downloading the file: ', err);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<>
			{import.meta.env.NODE_ENV !== 'production' && (
				<Button
					disabled={isDownloading}
					onClick={handleDownloadTransactions}
					variant='secondary'
				>
					Download
				</Button>
			)}
		</>
	);
}
