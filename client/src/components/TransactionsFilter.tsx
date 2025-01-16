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
import CategoryPicker from './CategoryPicker';
import { Category } from '@/types/category';
import _ from 'lodash';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { fetchAvailableCourses } from '@/api/student';
import { Input } from './ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useState } from 'react';
import { DatePickerWithRange } from './DatePickerWithRange';

type TransactionsFilterProps = {
	categories: Category[];
};

export default function TransactionsFilter({
	categories,
}: TransactionsFilterProps) {
	const {
		setCategory,
		setPeriod,
		setCourse,
		setStartDate,
		setEndDate,
		setStatus,
		setSearch,
		search,
		course,
		category,
	} = useTransactionFilterStore((state) => state);

	const { data: courses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	const [localSearch, setLocalSearch] =
		useState<TransactionsFilterValues['search']>(search);
	const debouncedSearch = useDebounce(localSearch);

	const periodsOptions = [
		{ value: 'all', label: 'All' },
		{ value: 'today', label: 'Today' },
		{ value: 'weekly', label: 'This Week' },
		{ value: 'monthly', label: 'This Month' },
		{ value: 'yearly', label: 'This Year' },
	];

	useEffect(() => {
		setSearch(debouncedSearch ?? '');
	}, [debouncedSearch, setSearch]);

	return (
		<div className='flex flex-wrap gap-2 text-muted-foreground'>
			{/* Search */}
			<div className='flex flex-col justify-end items-start gap-2'>
				<Label className='ml-1'>Search:</Label>
				<Input
					type='text'
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className='w-[250px]'
					placeholder='Search for name or student ID'
				/>
			</div>

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
						{courses &&
							['All'].concat(courses).map((course, i) => (
								<SelectItem key={i} value={course}>
									{course}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
			</div>

			<div className='space-x-1 flex justify-end items-end'>
				{/* <DatePicker date={date} setDate={setDate} error={undefined} /> */}
				<DatePickerWithRange
					setStartDate={setStartDate}
					setEndDate={setEndDate}
				/>
			</div>

			<div className='space-x-1 flex justify-end items-end'>
				<CategoryPicker
					error={undefined}
					defaultValue={category ?? 'All'}
					setCategory={setCategory}
					categories={[
						{
							_id: 'All',
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
