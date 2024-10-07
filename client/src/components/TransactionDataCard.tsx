import { Transaction } from '@/types/transaction';

type TransactionDataCardProps = {
	transaction: Transaction;
};

export default function TransactionDataCard({
	transaction,
}: TransactionDataCardProps) {
	return (
		<div className='text-muted-foreground'>
			<p>
				Date: {new Date(transaction.date).toLocaleDateString()}
				{' - '}
				{new Date(transaction.date).toLocaleTimeString()}
			</p>
			<p>Transaction ID: {transaction._id}</p>
			<p>Description: {transaction.description || 'Not provided'}</p>
		</div>
	);
}
