import { fetchCategories } from '@/api/category';
import { fetchTransactions } from '@/api/transaction';
import DownloadTransactionsButton from '@/components/buttons/DownloadTransactionsButton';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsFilter from '@/components/TransactionsFilter';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';

export default function Transaction() {
	const userRole = useUserStore((state) => state.user?.role);
	const {
		search,
		category,
		course,
		date,
		page,
		pageSize,
		period,
		status,
		setPage,
	} = useTransactionFilterStore((state) => state);

	const {
		data: fetchTransactionsResult,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [
			QUERY_KEYS.TRANSACTION,
			{ search, course, page, pageSize, date, category, status, period },
		],
		queryFn: () =>
			fetchTransactions(
				{ search, course, date, category, status, period },
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

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Transactions</Header>
				{isAuthorized(userRole, 'governor', 'treasurer', 'auditor') && (
					<AddTransactionForm categories={categories} />
				)}
			</StickyHeader>

			<div className='flex justify-between items-end flex-wrap gap-3'>
				<TransactionsFilter categories={categories} />
				{isAuthorized(userRole, 'governor', 'treasurer', 'auditor') && (
					<DownloadTransactionsButton />
				)}
			</div>
			<TransactionsTable
				isLoading={transactionsLoading}
				transactions={fetchTransactionsResult?.data}
			/>

			{fetchTransactionsResult && (
				<div className='md:absolute w-full p-5 md:bottom-0'>
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
