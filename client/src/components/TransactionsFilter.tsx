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
import _ from 'lodash';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { Input } from './ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useState } from 'react';
import { DatePickerWithRange } from './DatePickerWithRange';
import SchoolYearInput from './SchoolYearInput';
import SemInput from './SemInput';

export default function TransactionsFilter() {
	const { setPeriod, setStartDate, setEndDate, setSearch, search } =
		useTransactionFilterStore((state) => state);

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
		<div className='w-full space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:flex lg:flex-wrap lg:items-end gap-4'>
			{/* Search */}
			<div className='flex flex-col gap-2 w-full md:col-span-2 lg:w-[280px]'>
				<Label>Search</Label>
				<Input
					type='text'
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					placeholder='Search name or student ID'
				/>
			</div>

			{/* Date Range */}
			<div className='w-full md:col-span-2 lg:w-auto'>
				<DatePickerWithRange
					setStartDate={setStartDate}
					setEndDate={setEndDate}
				/>
			</div>

			{/* Period */}
			<div className='flex flex-col gap-2 w-full md:w-full lg:w-[100px]'>
				<Label>Period</Label>
				<Select
					defaultValue={periodsOptions[0].value}
					onValueChange={(value) => setPeriod(value as TransactionPeriodFilter)}
				>
					<SelectTrigger>
						<SelectValue placeholder='Select period' />
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

			{/* Semester */}
			<div className='w-full md:w-full lg:w-[130px]'>
				<SemInput />
			</div>

			{/* School Year */}
			<div className='w-full md:w-full lg:w-[150px]'>
				<SchoolYearInput />
			</div>
		</div>
	);
}
