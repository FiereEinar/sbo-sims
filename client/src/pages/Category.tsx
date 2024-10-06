import { fetchCategories } from '@/api/category';
import CategoriesTable from '@/components/CategoriesTable';
import { useQuery } from '@tanstack/react-query';

export default function Category() {
	const {
		data: categories,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['students'],
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
		<section>
			<h1 className='mb-3 text-lg'>Category Page</h1>
			<CategoriesTable categories={categories} />
		</section>
	);
}
