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
import { Category } from '@/types/category';

interface CategoriesTableProps {
	categories: Category[];
}

export default function CategoriesTable({ categories }: CategoriesTableProps) {
	const navigate = useNavigate();

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
				{categories.map((category) => (
					<TableRow
						className='cursor-pointer'
						onClick={() => navigate(`/category/${category._id}`)}
						key={category._id}
					>
						<TableCell className=''>{category.organization.name}</TableCell>
						<TableCell className=''>{category.name}</TableCell>
						<TableCell className=''>{category.fee}</TableCell>
						<TableCell className=''>TODO: implement</TableCell>
						<TableCell className='text-right'>TODO: implement</TableCell>
					</TableRow>
				))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={4}>Total</TableCell>
					<TableCell className='text-right'>TODO: implement</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}
