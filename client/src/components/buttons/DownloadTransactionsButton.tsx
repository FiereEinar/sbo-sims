import axiosInstance from '@/api/axiosInstance';
import { generateTransactionsFilterURL } from '@/api/transaction';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useState } from 'react';
import { Button } from '../ui/button';

type FileType = 'pdf' | 'csv';

export default function DownloadTransactionsButton() {
	const { getFilterValues } = useTransactionFilterStore((state) => state);
	const [isDownloading, setIsDownloading] = useState(false);

	const handleDownloadTransactions = async (fileType: FileType) => {
		try {
			setIsDownloading(true);
			const url = generateTransactionsFilterURL(
				{ ...getFilterValues(), page: 1 },
				`/transaction/download/${fileType}?page=1`
			);

			const result = await axiosInstance.get(url, {
				responseType: 'blob',
			});

			const blob = new Blob([result.data], {
				type: fileType === 'pdf' ? 'application/pdf' : 'text/csv',
			});
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'transactions.' + fileType;
			link.click();
			URL.revokeObjectURL(link.href);
		} catch (err: any) {
			console.error('Error downloading the file: ', err);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<>
			{import.meta.env.VITE_NODE_ENV !== 'production' && (
				<Button
					disabled={isDownloading}
					onClick={() => handleDownloadTransactions('csv')}
					variant='secondary'
				>
					Download
				</Button>
			)}
		</>
	);
}
