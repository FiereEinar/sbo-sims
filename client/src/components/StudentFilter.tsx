import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { Label } from './ui/label';
import { useStudentFilterStore } from '@/store/studentsFilter';
import SchoolYearInput from './SchoolYearInput';
import SemInput from './SemInput';

export default function StudentFilter() {
	const { setSearch, search } = useStudentFilterStore((state) => state);

	const [localSearch, setLocalSearch] = useState(search);
	const debouncedSearch = useDebounce(localSearch);

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
					placeholder='Search student ID or fullname'
				/>
			</div>

			{/* Semester */}
			<div className='w-full md:w-full lg:w-[150px]'>
				<SemInput />
			</div>

			{/* School Year */}
			<div className='w-full md:w-full lg:w-[150px]'>
				<SchoolYearInput />
			</div>
		</div>
	);
}
