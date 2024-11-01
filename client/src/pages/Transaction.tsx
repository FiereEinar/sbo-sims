import axiosInstance from '@/api/axiosInstance';
import { fetchCategories } from '@/api/category';
import { fetchAvailableCourses } from '@/api/student';
import {
	fetchTransactions,
	generateTransactionsFilterURL,
} from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsFilter from '@/components/TransactionsFilter';
import TransactionsTable from '@/components/TransactionsTable';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { TransactionsFilterValues } from '@/types/transaction';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Transaction() {
	const { toast } = useToast();

	const defaultFilterValue = 'All';
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const [period, setPeriod] = useState<TransactionsFilterValues['period']>();
	const [status, setStatus] = useState<TransactionsFilterValues['status']>();
	const [category, setCategory] =
		useState<TransactionsFilterValues['category']>();
	const [date, setDate] = useState<TransactionsFilterValues['date']>();
	// const [search, setSearch] = useState<TransactionsFilterValues['search']>();
	const [course, setCourse] =
		useState<TransactionsFilterValues['course']>(defaultFilterValue);

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

	const {
		data: courses,
		isLoading: cLoading,
		error: cError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	if (categoriesLoading || cLoading) {
		return <p>Loading...</p>;
	}

	if (transactionsError || categoriesError || cError || !categories) {
		return <p>Error</p>;
	}

	const handleDownloadTransactions = async () => {
		try {
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
				<TransactionsFilter
					categories={categories}
					courses={[defaultFilterValue].concat(courses ?? [])}
					onChange={(filters) => {
						// setSearch(filters.search);
						setStatus(filters.status);
						setPeriod(filters.period);
						setCategory(filters.category);
						setDate(filters.date);
						setCourse(
							filters.course === defaultFilterValue ? undefined : filters.course
						);
					}}
				/>
				<Button
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
		</SidebarPageLayout>
	);
}
