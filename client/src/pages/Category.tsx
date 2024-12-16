import { fetchCategoriesWithTransactions } from '@/api/category';
import CategoriesTable from '@/components/CategoriesTable';
import AddCategoryForm from '@/components/forms/AddCategoryForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';

export default function Category() {
	const userRole = useUserStore((state) => state.user?.role);
	const {
		data: categories,
		isLoading: cLoading,
		error: cError,
	} = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
		queryFn: fetchCategoriesWithTransactions,
	});

	if (cLoading) {
		return <p>Loading...</p>;
	}

	if (cError || !categories) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Categories</Header>
				{userRole === 'admin' && <AddCategoryForm />}
			</StickyHeader>
			<CategoriesTable categories={categories} />
		</SidebarPageLayout>
	);
}
