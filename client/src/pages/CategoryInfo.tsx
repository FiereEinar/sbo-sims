import { fetchCategoryAndTransactions } from '@/api/category';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteCategoryButton from '@/components/buttons/EditAndDeleteCategoryButton';
import CategoryDataCard from '@/components/CategoryDataCard';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsTable from '@/components/TransactionsTable';
import { QUERY_KEYS } from '@/constants';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function CategoryInfo() {
	const userRole = useUserStore((state) => state.user?.role);
	const { categoryID } = useParams();
	if (!categoryID) return;

	const { data, isLoading, error } = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY, { categoryID }],
		queryFn: () => fetchCategoryAndTransactions(categoryID),
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
				<CategoryDataCard category={data.category} />
				{userRole === 'admin' && (
					<EditAndDeleteCategoryButton category={data.category} />
				)}
			</StickyHeader>

			<TransactionsTable
				isLoading={isLoading}
				transactions={data.categoryTransactions}
			/>
		</SidebarPageLayout>
	);
}
