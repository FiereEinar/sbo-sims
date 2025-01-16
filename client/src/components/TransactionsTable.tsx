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
import { numberWithCommas } from '@/lib/utils';
import _ from 'lodash';
import CategoryPicker from './CategoryPicker';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { Category } from '@/types/category';
import { fetchCategories } from '@/api/category';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { fetchAvailableCourses } from '@/api/student';

type TransactionsTableProps = {
	transactions?: Transaction[];
	isLoading: boolean;
};

export default function TransactionsTable({
	transactions,
	isLoading,
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
					<TableHead className='w-[100px]'>Student ID</TableHead>
					<TableHead className='w-[200px]'>Fullname</TableHead>
					<TableHead className='w-[75px]'>
						<TableHeadCoursePicker />
					</TableHead>
					<TableHead className='w-[175px]'>Date</TableHead>
					<TableHead className='w-[300px]'>
						<TableHeadCategoryPicker />
					</TableHead>
					<TableHead className='w-[50px]'>
						<TableHeadStatusPicker />
					</TableHead>
					<TableHead className='w-[100px] text-right'>Amount</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{isLoading && (
					<TableRow>
						<TableCell colSpan={7}>Loading...</TableCell>
					</TableRow>
				)}
				{!transactions?.length && !isLoading && (
					<TableRow>
						<TableCell colSpan={7}>No transactions</TableCell>
					</TableRow>
				)}
				{transactions &&
					transactions.map((transaction) => {
						return (
							<TableRow
								onClick={() => navigate(`/transaction/${transaction._id}`)}
								className='cursor-pointer'
								key={transaction._id}
							>
								<TableCell className=''>
									{transaction.owner.studentID}
								</TableCell>
								<TableCell className=''>
									{_.startCase(
										`${transaction.owner.firstname} ${
											transaction.owner.middlename ?? ''
										} ${transaction.owner.lastname}`
									)}
								</TableCell>
								<TableCell className=''>{transaction.owner.course}</TableCell>
								<TableCell className=''>
									<DateText date={new Date(transaction.date)} />
								</TableCell>
								<TableCell className=''>
									{transaction.category.organization.name} -{' '}
									{transaction.category.name}
								</TableCell>
								<TableCell className=''>
									{transaction.amount >= transaction.category.fee ? (
										<p className='text-green-500'>Paid</p>
									) : (
										<p className='text-yellow-500'>Partial</p>
									)}
								</TableCell>
								<TableCell className='text-right'>
									P{numberWithCommas(transaction.amount)}
								</TableCell>
							</TableRow>
						);
					})}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={6}>Total</TableCell>
					<TableCell className='text-right'>
						P{numberWithCommas(totalAmount)}
					</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}

function TableHeadCategoryPicker() {
	const { category, setCategory } = useTransactionFilterStore((state) => state);
	const { data: categories } = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	return (
		<CategoryPicker
			clean={true}
			error={undefined}
			defaultValue={category ?? 'All'}
			setCategory={setCategory}
			categories={[
				{
					_id: 'All',
					name: 'All Categories',
					__v: 0,
					fee: 0,
					organization: '',
				} as unknown as Category,
			].concat(categories || [])}
		/>
	);
}

function TableHeadStatusPicker() {
	const { setStatus } = useTransactionFilterStore((state) => state);

	return (
		<div className='flex flex-col justify-end items-start gap-2 select-none'>
			<Select
				defaultValue={'All'}
				onValueChange={(value) => {
					let val: boolean | undefined;
					if (value === 'All') val = undefined;
					if (value === 'Paid') val = true;
					if (value === 'Partial') val = false;
					setStatus(val);
				}}
			>
				<SelectTrigger className='w-full border-none pl-0 focus:ring-0'>
					<SelectValue placeholder='Course' />
				</SelectTrigger>
				<SelectContent>
					{['All', 'Paid', 'Partial'].map((status, i) => (
						<SelectItem key={i} value={status}>
							{status}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function TableHeadCoursePicker() {
	const { course, setCourse } = useTransactionFilterStore((state) => state);
	const { data: courses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	return (
		<div className='flex flex-col justify-end items-start gap-2 select-none'>
			<Select defaultValue={course} onValueChange={(value) => setCourse(value)}>
				<SelectTrigger className='w-full border-none pl-0 focus:ring-0'>
					<SelectValue placeholder='Course' />
				</SelectTrigger>
				<SelectContent>
					{courses &&
						['All'].concat(courses).map((course, i) => (
							<SelectItem key={i} value={course}>
								{course === 'All' ? course + ' Courses' : course}
							</SelectItem>
						))}
				</SelectContent>
			</Select>
		</div>
	);
}
