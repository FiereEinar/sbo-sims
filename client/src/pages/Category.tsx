import { fetchCategories } from '@/api/category';
import CategoriesTable from '@/components/CategoriesTable';
import AddCategoryForm from '@/components/forms/AddCategoryForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { useQuery } from '@tanstack/react-query';

export default function Category() {
	const {
		data: categories,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['categories'],
		queryFn: fetchCategories,
	});

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (error || categories === undefined) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Category Page</Header>
				<AddCategoryForm />
			</StickyHeader>
			<CategoriesTable categories={categories} />
		</SidebarPageLayout>
	);
}
