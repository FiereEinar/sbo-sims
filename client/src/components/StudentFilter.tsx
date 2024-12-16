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
import { useStudentFilterStore } from '@/store/studentsFilter';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { fetchAvailableCourses } from '@/api/student';

type StudentFilterProps = {};

export default function StudentFilter({}: StudentFilterProps) {
	const {
		setSearch,
		setCourse,
		setYear,
		setGender,
		course,
		gender,
		year,
		search,
	} = useStudentFilterStore((state) => state);

	const [localSearch, setLocalSearch] = useState(search);
	const debouncedSearch = useDebounce(localSearch);

	const { data: courses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	useEffect(() => {
		setSearch(debouncedSearch ?? '');
	}, [debouncedSearch]);

	const gendersOptions = ['All', 'M', 'F'];
	const yearsOptions = ['All', '1', '2', '3', '4'];

	return (
		<div className='flex flex-wrap gap-2 text-muted-foreground'>
			{/* Search */}
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
						{courses &&
							['All'].concat(courses).map((course, i) => (
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
