import { fetchCategories } from '@/api/category';
import { fetchTransactions } from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import TransactionsTable from '@/components/TransactionsTable';
import { useQuery } from '@tanstack/react-query';

export default function Transaction() {
	const {
		data: transactions,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: ['transactions'],
		queryFn: fetchTransactions,
	});

	const {
		data: categories,
		isLoading: categoriesLoading,
		error: categoriesError,
	} = useQuery({
		queryKey: ['categories'],
		queryFn: fetchCategories,
	});

	if (transactionsLoading || categoriesLoading) {
		return <p>Loading...</p>;
	}

	if (transactionsError || categoriesError || !transactions || !categories) {
		return <p>Error</p>;
	}

	console.log(transactions);

	return (
		<SidebarPageLayout>
			<div className='flex justify-between'>
				<h1 className='mb-3 text-lg'>Transactions List</h1>
				<AddTransactionForm categories={categories} />
			</div>

			<TransactionsTable transactions={transactions} />
		</SidebarPageLayout>
	);
}
