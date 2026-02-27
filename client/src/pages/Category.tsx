import { fetchCategoriesWithTransactions } from '@/api/category';
import CategoriesCardView from '@/components/CategoriesCardView';
import CategoriesTable from '@/components/CategoriesTable';
import AddCategoryForm from '@/components/forms/AddCategoryForm';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import ViewModeToggle from '@/components/ViewModeToggle';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useViewModeStore } from '@/store/viewModeStore';
import { useQuery } from '@tanstack/react-query';

export default function Category() {
	const { viewMode } = useViewModeStore();

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
				<HasPermission permissions={[MODULES.CATEGORY_CREATE]}>
					<AddCategoryForm />
				</HasPermission>
			</StickyHeader>

			<div className='flex justify-between items-center'>
				<div />
				<ViewModeToggle />
			</div>

			{viewMode === 'table' ? (
				<CategoriesTable categories={categories} isLoading={isLoading} />
			) : (
				<CategoriesCardView categories={categories} isLoading={isLoading} />
			)}
		</SidebarPageLayout>
	);
}
