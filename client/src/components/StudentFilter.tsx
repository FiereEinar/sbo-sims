import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { StudentFilterValues } from '@/types/student';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

type StudentFilterProps = {
	onChange: (filters: StudentFilterValues) => void;
	courses: string[];
};

export default function StudentFilter({
	onChange,
	courses,
}: StudentFilterProps) {
	const [search, setSearch] = useState<StudentFilterValues['search']>('');
	const debouncedSearch = useDebounce(search);

	const [course, setCourse] = useState<StudentFilterValues['course']>(
		courses[0]
	);

	const [gender, setGender] = useState<StudentFilterValues['gender']>('All');
	const gendersOptions = ['All', 'M', 'F'];

	const [year, setYear] = useState<StudentFilterValues['year']>('All');
	const yearsOptions = ['All', '1', '2', '3', '4'];

	// having issues implementing this, it just defaults to acsending for now
	const [sortBy, setSortBy] = useState<StudentFilterValues['sortBy']>('asc');
	const sortingOptions = ['asc', 'dec'];

	useEffect(() => {
		onChange({ search: debouncedSearch, course, gender, year, sortBy });
	}, [debouncedSearch, course, gender, year, sortBy]);

	return (
		<div className='flex gap-2 text-muted-foreground'>
			{/* Search */}
			<div className='space-x-1'>
				<Label className='ml-1'>Search:</Label>
				<Input
					type='text'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className='w-[300px]'
					placeholder='Search for student ID or Fullname'
				/>
			</div>

			{/* Course */}
			<div className='space-x-1'>
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

			{/* Year level */}
			<div className='space-x-1'>
				<Label className='ml-1'>Year:</Label>
				<Select
					defaultValue={year}
					onValueChange={(value) =>
						setYear(value as StudentFilterValues['year'])
					}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Gender' />
					</SelectTrigger>
					<SelectContent>
						{yearsOptions.map((year, i) => (
							<SelectItem key={i} value={year}>
								{year}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Gender */}
			<div className='space-x-1'>
				<Label className='ml-1'>Gender:</Label>
				<Select
					defaultValue={gender}
					onValueChange={(value) =>
						setGender(value as StudentFilterValues['gender'])
					}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Gender' />
					</SelectTrigger>
					<SelectContent>
						{gendersOptions.map((gender, i) => (
							<SelectItem key={i} value={gender}>
								{gender}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Name sort */}
			{/* <div className='space-x-1'>
				<Label className='ml-1'>Sort name:</Label>
				<Select
					defaultValue={sortBy}
					onValueChange={(value) =>
						setSortBy(value as StudentFilterValues['sortBy'])
					}
				>
					<SelectTrigger className='w-full'>
						<SelectValue placeholder='Gender' />
					</SelectTrigger>
					<SelectContent>
						{sortingOptions.map((opt, i) => (
							<SelectItem key={i} value={opt}>
								{opt === 'asc' ? 'Ascending' : 'Decending'}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div> */}
		</div>
	);
}
