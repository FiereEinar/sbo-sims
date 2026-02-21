import { fetchCategoryAndTransactions } from '@/api/category';
import BackButton from '@/components/buttons/BackButton';
import DownloadTransactionsButton from '@/components/buttons/DownloadTransactionsButton';
import EditAndDeleteCategoryButton from '@/components/buttons/EditAndDeleteCategoryButton';
import CategoryDataCard from '@/components/CategoryDataCard';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsFilter from '@/components/TransactionsFilter';
import TransactionsTable from '@/components/TransactionsTable';
import { QUERY_KEYS } from '@/constants';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

const pageSize = 10;

export default function CategoryInfo() {
	const { categoryID } = useParams();
	if (!categoryID) return;

	const { getFilterValues } = useTransactionFilterStore((state) => state);
	const [page, setPage] = useState(1);

	const { data, isLoading, error } = useQuery({
		queryKey: [
			QUERY_KEYS.CATEGORY,
			{ ...getFilterValues(), categoryID, page, pageSize },
		],
		queryFn: () =>
			fetchCategoryAndTransactions(
				getFilterValues(),
				categoryID,
				page,
				pageSize,
			),
	});

	if (error) {
		return <p>Session expired, login again</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			{isLoading && <StickyHeaderLoading />}
			{data?.data && (
				<StickyHeader>
					<CategoryDataCard category={data.data.category} />
					<div className='flex flex-col items-start sm:items-end space-y-2'>
						<EditAndDeleteCategoryButton category={data.data.category} />
						<DownloadTransactionsButton categoryID={categoryID} />
					</div>
				</StickyHeader>
			)}

			<TransactionsFilter />

			<TransactionsTable
				disableCategories={true}
				isLoading={isLoading}
				transactions={data?.data?.categoryTransactions}
			/>

			{data && (
				<PaginationController
					currentPage={page ?? 1}
					nextPage={data.next}
					prevPage={data.prev}
					setPage={setPage}
				/>
			)}
		</SidebarPageLayout>
	);
}
