import { fetchTransactions } from '@/api/transaction';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import TransactionsTable from '@/components/TransactionsTable';
import { Button } from '@/components/ui/button';
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

	if (transactionsLoading) {
		return <p>Loading...</p>;
	}

	if (transactionsError || !transactions) {
		return <p>Error</p>;
	}

	console.log(transactions);

	return (
		<SidebarPageLayout>
			<div className='flex justify-between'>
				<h1 className='mb-3 text-lg'>Transactions List</h1>
				<Button className='flex justify-center gap-1' size='sm'>
					<img className='size-5' src='/icons/plus.svg' alt='' />
					<p>Add Transaction</p>
				</Button>
			</div>

			<TransactionsTable transactions={transactions} />
		</SidebarPageLayout>
	);
}
