import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { Label } from './ui/label';
import { useStudentFilterStore } from '@/store/studentsFilter';
import SchoolYearInput from './SchoolYearInput';
import SemInput from './SemInput';

type StudentFilterProps = {};

export default function StudentFilter({}: StudentFilterProps) {
	const { setSearch, search } = useStudentFilterStore((state) => state);

	const [localSearch, setLocalSearch] = useState(search);
	const debouncedSearch = useDebounce(localSearch);

	useEffect(() => {
		setSearch(debouncedSearch ?? '');
	}, [debouncedSearch]);

	return (
		<div className='flex flex-wrap gap-2 text-muted-foreground'>
			<div className='space-x-1'>
				<Label className='ml-1'>Search:</Label>
				<Input
					type='text'
					value={localSearch}
					onChange={(e) => setLocalSearch(e.target.value)}
					className='w-[250px]'
					placeholder='Search for student ID or Fullname'
				/>
			</div>

			<SemInput />
			<SchoolYearInput />
		</div>
	);
}
