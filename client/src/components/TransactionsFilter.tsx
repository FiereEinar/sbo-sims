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
		<div className='flex flex-wrap gap-2 text-muted-foreground'>
			{/* Search */}
			<div className='flex flex-col justify-end items-start gap-2'>
				<Label>Search:</Label>
				<Input
					type='text'
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className='w-[250px]'
					placeholder='Search for name or student ID'
				/>
			</div>

			<div className='space-x-1 flex justify-end items-end'>
				<DatePickerWithRange
					setStartDate={setStartDate}
					setEndDate={setEndDate}
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
		</div>
	);
}
