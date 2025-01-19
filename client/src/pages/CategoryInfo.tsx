import { fetchCategoryAndTransactions } from '@/api/category';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteCategoryButton from '@/components/buttons/EditAndDeleteCategoryButton';
import CategoryDataCard from '@/components/CategoryDataCard';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsTable from '@/components/TransactionsTable';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
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
		queryKey: [QUERY_KEYS.CATEGORY, { categoryID, page, pageSize }],
		queryFn: () => fetchCategoryAndTransactions(categoryID, page, pageSize),
	});

	if (error) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			{isLoading && <StickyHeaderLoading />}
			{data?.data && (
				<StickyHeader>
					<CategoryDataCard category={data.data.category} />
					{isAuthorized(userRole, 'governor') && (
						<EditAndDeleteCategoryButton category={data.data.category} />
					)}
				</StickyHeader>
			)}

			<TransactionsTable
				disableFiltes={true}
				isLoading={isLoading}
				transactions={data?.data?.categoryTransactions}
			/>

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
