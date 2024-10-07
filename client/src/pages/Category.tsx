import { fetchCategories } from '@/api/category';
import CategoriesTable from '@/components/CategoriesTable';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import { Button } from '@/components/ui/button';
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

	console.log(categories);

	return (
		<SidebarPageLayout>
			<div className='flex justify-between'>
				<Header>Category Page</Header>
				<Button className='flex justify-center gap-1' size='sm'>
					<img className='size-5' src='/icons/plus.svg' alt='' />
					<p>Add Category</p>
				</Button>
			</div>
			<CategoriesTable categories={categories} />
		</SidebarPageLayout>
	);
}
