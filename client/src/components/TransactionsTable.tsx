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
import { useNavigate } from 'react-router-dom';
import DateText from './ui/date-text';

type TransactionsTableProps = {
	transactions: Transaction[];
};
export default function TransactionsTable({
	transactions,
}: TransactionsTableProps) {
	const navigate = useNavigate();
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
					<TableHead className='w-[200px]'>Student ID</TableHead>
					<TableHead className='w-[200px]'>Date</TableHead>
					<TableHead className='w-[200px]'>Category</TableHead>
					<TableHead className='w-[100px] text-right'>Status</TableHead>
					<TableHead className='w-[100px] text-right'>Amount</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{transactions.map((transaction) => {
					return (
						<TableRow
							onClick={() => navigate(`/transaction/${transaction._id}`)}
							className='cursor-pointer'
							key={transaction._id}
						>
							<TableCell className=''>{transaction.owner.studentID}</TableCell>
							<TableCell className=''>
								<DateText date={new Date(transaction.date)} />
							</TableCell>
							<TableCell className=''>{transaction.category.name}</TableCell>
							<TableCell className='text-right'>
								{transaction.amount >= transaction.category.fee ? (
									<p className='text-green-500'>Paid</p>
								) : (
									<p className='text-yellow-500'>Partial</p>
								)}
							</TableCell>
							<TableCell className='text-right'>
								P{transaction.amount}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={4}>Total</TableCell>
					<TableCell className='text-right'>P{totalAmount}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
