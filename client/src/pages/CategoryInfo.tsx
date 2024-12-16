import { fetchTransactions } from '@/api/transaction';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteCategoryButton from '@/components/buttons/EditAndDeleteCategoryButton';
import CategoryDataCard from '@/components/CategoryDataCard';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsTable from '@/components/TransactionsTable';
import { QUERY_KEYS } from '@/constants';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

const pageSize = 10;

export default function CategoryInfo() {
	const [page, setPage] = useState(1);
	const userRole = useUserStore((state) => state.user?.role);
	const { categoryID } = useParams();
	if (!categoryID) return;

	const { data, isLoading, error } = useQuery({
		queryKey: [
			QUERY_KEYS.TRANSACTION,
			{ category: categoryID, page, pageSize },
		],
		queryFn: () => fetchTransactions({ category: categoryID }, page, pageSize),
	});

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (error || !data) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<div className='mt-5' />

			<BackButton />

			<StickyHeader>
				<CategoryDataCard category={data.data[0].category} />
				{userRole === 'admin' && (
					<EditAndDeleteCategoryButton category={data.data[0].category} />
				)}
			</StickyHeader>

			<TransactionsTable isLoading={isLoading} transactions={data.data} />

			{data && (
				<div className='md:absolute w-full p-5 md:bottom-0'>
					<PaginationController
						currentPage={page ?? 1}
						nextPage={data.next}
						prevPage={data.prev}
						setPage={setPage}
					/>
				</div>
			)}
		</SidebarPageLayout>
	);
}
