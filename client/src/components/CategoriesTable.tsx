import { useNavigate } from 'react-router-dom';
import {
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
	Table,
} from './ui/table';
import { CategoryWithTransactions } from '@/types/category';
import { useEffect, useState } from 'react';

interface CategoriesTableProps {
	categories: CategoryWithTransactions[];
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
	const [totalAmount, setTotalAmount] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		if (categories) {
			setTotalAmount(
				categories.reduce((prevAmount, curr) => {
					return prevAmount + curr.totalTransactionsAmount || 0;
				}, 0)
			);
		}
	}, [categories]);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='w-[300px]'>Category name</TableHead>
					<TableHead className='w-[300px]'>Total transactions</TableHead>
					<TableHead className='w-[200px] text-right'>
						Total Transactions amount
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{categories.map((category) => (
					<TableRow
						className='cursor-pointer'
						onClick={() => navigate(`/category/${category._id}`)}
						key={category._id}
					>
						<TableCell className=''>{category.name}</TableCell>
						<TableCell className=''>{category.totalTransactions}</TableCell>
						<TableCell className='text-right'>
							{category.totalTransactionsAmount ?? 0}
						</TableCell>
					</TableRow>
				))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={2}>Total</TableCell>
					<TableCell className='text-right'>{totalAmount}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
