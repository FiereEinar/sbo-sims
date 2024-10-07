import { fetchCategoryAndTransactions } from '@/api/category';
import BackButton from '@/components/buttons/BackButton';
import TransactionsTable from '@/components/TransactionsTable';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function CategoryInfo() {
	const { categoryID } = useParams();
	if (!categoryID) return;

	const { data, isLoading, error } = useQuery({
		queryKey: [`category_${categoryID}`],
		queryFn: () => fetchCategoryAndTransactions(categoryID),
	});

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (error || !data) {
		return <p>Error</p>;
	}

	console.log(data);

	return (
		<section>
			<div className='space-y-3'>
				<BackButton />
				<h1 className='text-2xl'>
					Previous transactions for "{data.category.name}"
				</h1>
				<TransactionsTable transactions={data.categoryTransactions} />
			</div>
		</section>
	);
}
