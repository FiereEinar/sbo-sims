import { Transaction } from '@/types/transaction';
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from './ui/table';
import { useEffect, useState } from 'react';

type TransactionsTableProps = {
	transactions: Transaction[];
};
export default function TransactionsTable({
	transactions,
}: TransactionsTableProps) {
	const [totalAmount, setTotalAmount] = useState(0);

	useEffect(() => {
		if (transactions) {
			setTotalAmount(
				transactions.reduce((prevAmount, curr) => {
					return prevAmount + curr.amount;
				}, 0)
			);
		}
	}, [transactions]);

	return (
		<Table>
			{/* <TableCaption>A list of your recent invoices.</TableCaption> */}
			<TableHeader>
				<TableRow>
					<TableHead>Date</TableHead>
					<TableHead>Category</TableHead>
					<TableHead>Description</TableHead>
					<TableHead>Amount</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{transactions.map((transaction) => (
					<TableRow key={transaction._id}>
						<TableCell className='text-muted-foreground'>
							{new Date(transaction.date).toLocaleDateString()}{' '}
							{new Date(transaction.date).toLocaleTimeString()}
						</TableCell>
						<TableCell className='text-muted-foreground'>
							{transaction.category.name}
						</TableCell>
						<TableCell className='text-muted-foreground'>
							{transaction.description}
						</TableCell>
						<TableCell className='text-right'>{transaction.amount}</TableCell>
					</TableRow>
				))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className='text-right'>{totalAmount}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
