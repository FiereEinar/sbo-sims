import axiosInstance from '@/api/axiosInstance';
import { fetchCategories } from '@/api/category';
import {
	fetchTransactions,
	generateTransactionsFilterURL,
} from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsFilter from '@/components/TransactionsFilter';
import TransactionsTable from '@/components/TransactionsTable';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Transaction() {
	const [isDownloading, setIsDownloading] = useState(false);
	const { category, course, date, page, pageSize, period, status, setPage } =
		useTransactionFilterStore((state) => state);
	const { toast } = useToast();

	const {
		data: fetchTransactionsResult,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [
			QUERY_KEYS.TRANSACTION,
			{ course, page, pageSize, date, category, status, period },
		],
		queryFn: () =>
			fetchTransactions(
				{ course, date, category, status, period },
				page,
				pageSize
			),
	});

	const {
		data: categories,
		isLoading: categoriesLoading,
		error: categoriesError,
	} = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	if (categoriesLoading) {
		return <p>Loading...</p>;
	}

	if (transactionsError || categoriesError || !categories) {
		return <p>Error</p>;
	}

	const handleDownloadTransactions = async () => {
		try {
			setIsDownloading(true);
			const url = generateTransactionsFilterURL(
				{ course, date, category, status, period },
				`/transaction/download?page=1`
			);

			const result = await axiosInstance.get(url, {
				responseType: 'blob',
			});

			// Create a URL for the blob and trigger the download
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
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Transactions</Header>
				<AddTransactionForm categories={categories} />
			</StickyHeader>

			<div className='flex justify-between items-end flex-wrap gap-3'>
				<TransactionsFilter categories={categories} />
				<Button
					disabled={isDownloading}
					onClick={async () => {
						if (!fetchTransactionsResult?.data.length) {
							toast({
								title: 'Unable to download',
								description: "There's no transactions to download",
							});
							return;
						}

						await handleDownloadTransactions();
					}}
					variant='secondary'
				>
					Download
				</Button>
			</div>
			<TransactionsTable
				isLoading={transactionsLoading}
				transactions={fetchTransactionsResult?.data}
			/>

			{fetchTransactionsResult && (
				<div className='absolute w-full p-5 bottom-0'>
					<PaginationController
						currentPage={page ?? 1}
						nextPage={fetchTransactionsResult.next}
						prevPage={fetchTransactionsResult.prev}
						setPage={setPage}
					/>
				</div>
			)}
		</SidebarPageLayout>
	);
}
