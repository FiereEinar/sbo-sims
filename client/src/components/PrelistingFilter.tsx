import { useDebounce } from '@/hooks/useDebounce';
import { usePrelistingFilterStore } from '@/store/prelistingFilter';
import { PrelistingFilterValues } from '@/types/prelisting';
import { useEffect, useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { DatePickerWithRange } from './DatePickerWithRange';

export default function PrelistingFilter() {
	const { setStartDate, setEndDate, setSearch, search } =
		usePrelistingFilterStore((state) => state);

	const [localSearch, setLocalSearch] =
		useState<PrelistingFilterValues['search']>(search);
	const debouncedSearch = useDebounce(localSearch);

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
		</div>
	);
}
