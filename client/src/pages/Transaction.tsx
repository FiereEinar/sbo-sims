import { fetchCategories } from '@/api/category';
import { fetchTransactions } from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
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

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Transactions List</Header>
				<AddTransactionForm categories={categories} />
			</StickyHeader>

			<TransactionsTable transactions={transactions} />
		</SidebarPageLayout>
	);
}
