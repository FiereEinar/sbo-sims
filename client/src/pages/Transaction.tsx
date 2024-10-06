import { fetchTransactions } from '@/api/transaction';
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

	if (transactionsLoading) {
		return <p>Loading...</p>;
	}

	if (transactionsError || !transactions) {
		return <p>Error</p>;
	}

	console.log(transactions);

	return (
		<section>
			<div>
				<h1 className='mb-3 text-lg'>Transactions List</h1>
				<TransactionsTable transactions={transactions} />
			</div>
		</section>
	);
}
