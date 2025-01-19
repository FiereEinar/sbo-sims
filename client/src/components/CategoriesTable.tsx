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
import { numberWithCommas } from '@/lib/utils';
import TableLoading from './loading/TableLoading';

interface CategoriesTableProps {
	categories?: CategoryWithTransactions[];
	isLoading: boolean;
}

export default function CategoriesTable({
	categories,
	isLoading,
}: CategoriesTableProps) {
	const [totalAmount, setTotalAmount] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		if (categories) {
			setTotalAmount(
				categories.reduce((prev, curr) => {
					return prev + curr.totalTransactionsAmount;
				}, 0)
			);
		}
	}, [categories, setTotalAmount]);
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className='w-[200px]'>Organization</TableHead>
					<TableHead className='w-[200px]'>Category name</TableHead>
					<TableHead className='w-[200px]'>Category fee</TableHead>
					<TableHead className='w-[200px]'>Total transactions</TableHead>
					<TableHead className='w-[200px] text-right'>
						Total Transactions amount
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{isLoading && <TableLoading colSpan={5} />}
				{categories &&
					categories.map((category) => (
						<TableRow
							className='cursor-pointer'
							onClick={() => navigate(`/category/${category._id}`)}
							key={category._id}
						>
							<TableCell className=''>{category.organization.name}</TableCell>
							<TableCell className=''>{category.name}</TableCell>
							<TableCell className=''>
								{numberWithCommas(category.fee)}
							</TableCell>
							<TableCell className=''>{category.totalTransactions}</TableCell>
							<TableCell className='text-right'>
								{numberWithCommas(category.totalTransactionsAmount)}
							</TableCell>
						</TableRow>
					))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={4}>Total</TableCell>
					<TableCell className='text-right'>
						{numberWithCommas(totalAmount)}
					</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
