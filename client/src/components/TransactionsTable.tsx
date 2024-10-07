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
					<TableHead className='w-[200px]'>Date</TableHead>
					<TableHead className='w-[200px]'>Category</TableHead>
					<TableHead className='w-[200px]'>Description</TableHead>
					<TableHead className='w-[200px] text-right'>Amount</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{transactions.map((transaction) => (
					<TableRow className='cursor-pointer' key={transaction._id}>
						<TableCell className=''>
							{new Date(transaction.date).toLocaleDateString()}
							{' - '}
							{new Date(transaction.date).toLocaleTimeString()}
						</TableCell>
						<TableCell className=''>{transaction.category.name}</TableCell>
						<TableCell className=' max-w-[300px]'>
							{transaction.description}
						</TableCell>
						<TableCell className='text-right'>P{transaction.amount}</TableCell>
					</TableRow>
				))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className='text-right'>P{totalAmount}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
