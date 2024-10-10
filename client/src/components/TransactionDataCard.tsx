import { Transaction } from '@/types/transaction';
import DateText from './ui/date-text';

type TransactionDataCardProps = {
	transaction: Transaction;
};

export default function TransactionDataCard({
	transaction,
}: TransactionDataCardProps) {
	return (
		<div className='text-muted-foreground'>
			<DateText prefix='Date: ' date={new Date(transaction.date)} />
			<p>Transaction ID: {transaction._id}</p>
			<p>Description: {transaction.description || 'Not provided'}</p>
			<p>For: {transaction.category.name}</p>
			<p>Required amount: P{transaction.category.fee}</p>
		</div>
	);
}
