import { fetchCategories } from '@/api/category';
import { fetchTransactions } from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsFilter from '@/components/TransactionsFilter';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { TransactionsFilterValues } from '@/types/transaction';
import { useQuery } from '@tanstack/react-query';
import ImportTransactionsButton from '@/components/buttons/ImportTransactionsButton';
import HasPermission from '@/components/HasPermission';

export default function Transaction() {
	const { page, pageSize, getFilterValues, setPage } =
		useTransactionFilterStore((state) => state);

	const {
		data: fetchTransactionsResult,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [QUERY_KEYS.TRANSACTION, getFilterValues()],
		queryFn: () => fetchTransactions(getFilterValues(), page, pageSize),
	});

	const { data: categories, error: categoriesError } = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	const prefetchPageFn = (page: number) => {
		const filters: TransactionsFilterValues = {
			...getFilterValues(),
			page: page,
		};

		// check if it was already prefetched
		const data = queryClient.getQueryData([QUERY_KEYS.TRANSACTION, filters]);
		if (data) return;

		queryClient.prefetchQuery({
			queryKey: [QUERY_KEYS.TRANSACTION, filters],
			queryFn: () => fetchTransactions(filters, page, pageSize),
		});
	};

	if (transactionsError || categoriesError) {
		return <p>Session expired, login again.</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Transactions</Header>

				<HasPermission permissions={[MODULES.TRANSACTION_CREATE]}>
					<AddTransactionForm categories={categories} />
				</HasPermission>
			</StickyHeader>

			<div className='flex justify-between items-end flex-wrap gap-3'>
				<TransactionsFilter />

				<HasPermission permissions={[MODULES.TRANSACTION_IMPORT]}>
					<ImportTransactionsButton categories={categories} />
				</HasPermission>
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
						prefetchFn={prefetchPageFn}
					/>
				</div>
			)}
		</SidebarPageLayout>
	);
}
