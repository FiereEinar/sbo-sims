import { fetchCategoriesWithTransactions } from '@/api/category';
import CategoriesTable from '@/components/CategoriesTable';
import AddCategoryForm from '@/components/forms/AddCategoryForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';

export default function Category() {
	const userRole = useUserStore((state) => state.user?.role);
	const {
		data: categories,
		isLoading,
		error,
	} = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
		queryFn: fetchCategoriesWithTransactions,
	});

	if (error) {
		return <p>Session expired, login again.</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Categories</Header>
				{isAuthorized(userRole, 'governor') && <AddCategoryForm />}
			</StickyHeader>
			<CategoriesTable categories={categories} isLoading={isLoading} />
		</SidebarPageLayout>
	);
}
