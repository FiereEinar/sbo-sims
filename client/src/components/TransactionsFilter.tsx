import { useEffect, useState } from 'react';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import {
	TransactionPeriodFilter,
	TransactionsFilterValues,
} from '@/types/transaction';
import DatePicker from './DatePicker';
import CategoryPicker from './CategoryPicker';
import { Category } from '@/types/category';
import _ from 'lodash';

type TransactionsFilterProps = {
	onChange: (filters: TransactionsFilterValues) => void;
	courses: string[];
	categories: Category[];
};

export default function TransactionsFilter({
	courses,
	onChange,
	categories,
}: TransactionsFilterProps) {
	const [date, setDate] = useState<TransactionsFilterValues['date']>();
	const [period, setPeriod] = useState<TransactionsFilterValues['period']>();
	const [status, setStatus] = useState<TransactionsFilterValues['status']>();
	const [category, setCategory] =
		useState<TransactionsFilterValues['category']>();
	// const [search, setSearch] = useState<TransactionsFilterValues['search']>('');
	// const debouncedSearch = useDebounce(search);

	const [course, setCourse] = useState<TransactionsFilterValues['course']>(
		courses[0]
	);

	const periodsOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'today', label: 'Today' },
		{ value: 'weekly', label: 'This Week' },
		{ value: 'monthly', label: 'This Month' },
		{ value: 'yearly', label: 'This Year' },
	];

	useEffect(() => {
		onChange({ course, date, category, status, period });
	}, [onChange, course, date, category, status, period]);

	return (
		<div className='flex gap-2 text-muted-foreground'>
			{/* Search */}
			{/* <div className='space-x-1'>
				<Label className='ml-1'>Search:</Label>
				<Input
					type='text'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className='w-[300px]'
					placeholder='Search for student ID'
				/>
			</div> */}

			{/* Period */}
			<div className='flex flex-col justify-end items-start gap-2'>
				<Label className='ml-1'>Period:</Label>
				<Select
					defaultValue={periodsOptions[0].value}
					onValueChange={(value) => setPeriod(value as TransactionPeriodFilter)}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Course' />
					</SelectTrigger>
					<SelectContent>
						{periodsOptions.map((period, i) => (
							<SelectItem key={i} value={period.value}>
								{_.startCase(period.label)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Course */}
			<div className='flex flex-col justify-end items-start gap-2'>
				<Label className='ml-1'>Course:</Label>
				<Select
					defaultValue={course}
					onValueChange={(value) => setCourse(value)}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Course' />
					</SelectTrigger>
					<SelectContent>
						{courses.map((course, i) => (
							<SelectItem key={i} value={course}>
								{course}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='space-x-1 flex justify-end items-end'>
				<DatePicker date={date} setDate={setDate} error={undefined} />
			</div>

			<div className='space-x-1 flex justify-end items-end'>
				<CategoryPicker
					error={undefined}
					defaultValue={category}
					setCategory={setCategory}
					categories={[
						{
							_id: undefined,
							name: 'All',
							__v: 0,
							fee: 0,
							organization: '',
						} as unknown as Category,
					].concat(categories)}
				/>
			</div>

			{/* Status */}
			<div className='flex flex-col justify-end items-start gap-2'>
				<Label className='ml-1'>Status:</Label>
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
					<SelectTrigger className='w-full'>
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
		</div>
	);
}
