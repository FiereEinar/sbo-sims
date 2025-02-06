import {
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
	TableFooter,
	Table,
} from './ui/table';
import { StudentFilterValues, StudentWithTransactions } from '@/types/student';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import _ from 'lodash';
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
import { fetchAvailableCourses, fetchStudents } from '@/api/student';
import TableLoading from './loading/TableLoading';
import { queryClient } from '@/main';

interface StudentsTableProps {
	students: StudentWithTransactions[] | undefined;
	isLoading: boolean;
}

export default function StudentsTable({
	students,
	isLoading,
}: StudentsTableProps) {
	const [totalAmount, setTotalAmount] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		if (students) {
			setTotalAmount(
				students.reduce((prevAmount, curr) => {
					return prevAmount + curr.totalTransactionsAmount || 0;
				}, 0)
			);
		}
	}, [students]);

	return (
		<Table>
			<TableHeader>
				<TableRow className='select-none'>
					<TableHead className='w-[100px]'>Student ID</TableHead>
					<TableHead className='w-[250px]'>Full name</TableHead>
					<TableHead className='w-[150px]'>
						<TableHeadCoursePicker />
					</TableHead>
					<TableHead className='w-[100px]'>
						<TableHeadYearPicker />
					</TableHead>
					<TableHead className='w-[100px]'>
						<TableHeadGenderPicker />
					</TableHead>
					<TableHead className='w-[100px]'>Transactions made</TableHead>
					<TableHead className='w-[200px] text-right '>
						Transactions amount
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{isLoading && <TableLoading colSpan={7} />}
				{!students?.length && !isLoading && (
					<TableRow>
						<TableCell colSpan={7}>No students</TableCell>
					</TableRow>
				)}
				{students &&
					students.map((student) => (
						<TableRow
							className='cursor-pointer'
							onClick={() => navigate(`/student/${student.studentID}`)}
							key={student._id}
						>
							<TableCell className=''>{student.studentID}</TableCell>
							<TableCell className=''>
								{_.startCase(
									`${student.firstname} ${student.middlename ?? ''} ${
										student.lastname
									}`.toLowerCase()
								)}
							</TableCell>
							<TableCell className=''>{student.course}</TableCell>
							<TableCell className=''>{student.year}</TableCell>
							<TableCell className=''>{student.gender}</TableCell>
							<TableCell className=''>
								{student.totalTransactions ?? 0}
							</TableCell>
							<TableCell className='text-right'>
								{student.totalTransactionsAmount ?? 0}
							</TableCell>
						</TableRow>
					))}
			</TableBody>

			<TableFooter>
				<TableRow>
					<TableCell colSpan={6}>Total</TableCell>
					<TableCell className='text-right'>{totalAmount}</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}

function TableHeadCoursePicker() {
	const { course, page, pageSize, setCourse, getFilterValues } =
		useStudentFilterStore((state) => state);
	const { data: courses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	const prefetch = (course: string) => {
		if (course !== 'All') {
			const filters = { ...getFilterValues(), course };
			const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);

			if (data) return;

			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.STUDENT, filters],
				queryFn: () => fetchStudents(filters, page, pageSize),
			});
		}
	};

	return (
		<div className='space-x-1'>
			<Select defaultValue={course} onValueChange={(value) => setCourse(value)}>
				<SelectTrigger className='w-full border-none pl-0 focus:ring-0'>
					<SelectValue placeholder='Course' />
				</SelectTrigger>
				<SelectContent>
					{courses &&
						['All'].concat(courses).map((course, i) => (
							<SelectItem
								key={i}
								value={course}
								onMouseEnter={() => prefetch(course)}
							>
								{course === 'All' ? 'Courses: ' + course : course}
							</SelectItem>
						))}
				</SelectContent>
			</Select>
		</div>
	);
}

function TableHeadYearPicker() {
	const { page, pageSize, year, setYear, getFilterValues } =
		useStudentFilterStore((state) => state);
	const yearsOptions = ['All', '1', '2', '3', '4'];

	const prefetch = (selectedYear: StudentFilterValues['year']) => {
		if (selectedYear !== 'All') {
			const filters = { ...getFilterValues(), year: selectedYear };
			const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);

			if (data) return;

			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.STUDENT, filters],
				queryFn: () => fetchStudents(filters, page, pageSize),
			});
		}
	};

	return (
		<div className='space-x-1'>
			<Select
				defaultValue={year}
				onValueChange={(value) => setYear(value as StudentFilterValues['year'])}
			>
				<SelectTrigger className='w-full border-none pl-0 focus:ring-0'>
					<SelectValue placeholder='Gender' />
				</SelectTrigger>
				<SelectContent>
					{yearsOptions.map((year, i) => (
						<SelectItem
							key={i}
							value={year}
							onMouseEnter={() => prefetch(year as StudentFilterValues['year'])}
						>
							{year === 'All' ? ' Year: ' + year : year}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function TableHeadGenderPicker() {
	const { page, pageSize, gender, setGender, getFilterValues } =
		useStudentFilterStore((state) => state);
	const gendersOptions = ['All', 'M', 'F'];

	const prefetch = (selectedGender: StudentFilterValues['gender']) => {
		if (selectedGender !== 'All') {
			console.log('prefetching');
			const filters = { ...getFilterValues(), gender: selectedGender };
			const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);

			if (data) return;

			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.STUDENT, filters],
				queryFn: () => fetchStudents(filters, page, pageSize),
			});
			console.log('done prefetching');
		}
	};

	return (
		<Select
			defaultValue={gender}
			onValueChange={(value) =>
				setGender(value as StudentFilterValues['gender'])
			}
		>
			<SelectTrigger className='w-full border-none pl-0 focus:ring-0'>
				<SelectValue placeholder='Gender' />
			</SelectTrigger>
			<SelectContent>
				{gendersOptions.map((gender, i) => (
					<SelectItem
						key={i}
						value={gender}
						onMouseEnter={() =>
							prefetch(gender as StudentFilterValues['gender'])
						}
					>
						{gender === 'All' ? ' Gender: ' + gender : gender}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
