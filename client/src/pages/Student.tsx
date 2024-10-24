import { fetchAvailableCourses, fetchStudents } from '@/api/student';
import { AddStudentForm } from '@/components/forms/AddStudentForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentFilter from '@/components/StudentFilter';
import StudentsTable from '@/components/StudentsTable';
import Header from '@/components/ui/header';
import { StudentFilterValues } from '@/types/student';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';

export default function Student() {
	const [page, setPage] = useState(1);
	const pageSize = 10;

	const defaultFilterValue = 'All';
	const [search, setSearch] = useState<StudentFilterValues['search']>();
	const [course, setCourse] = useState<StudentFilterValues['course']>();
	const [gender, setGender] = useState<StudentFilterValues['gender']>();
	const [sortBy, setSortBy] = useState<StudentFilterValues['sortBy']>('asc');
	const [year, setYear] = useState<StudentFilterValues['year']>();

	const {
		data: studentsFetchResult,
		isLoading: studentsLoading,
		error: studentsError,
	} = useQuery({
		queryKey: [
			'students',
			{ search, course, gender, year, page, pageSize, sortBy },
		],
		queryFn: () =>
			fetchStudents({ search, gender, year, course, sortBy }, page, pageSize),
	});

	const {
		data: courses,
		isLoading: cLoading,
		error: cError,
	} = useQuery({
		queryKey: ['students_courses'],
		queryFn: fetchAvailableCourses,
	});

	const onFilterChange = (filters: StudentFilterValues) => {
		setSearch(filters.search);
		setSortBy(filters.sortBy);
		setCourse(
			filters.course === defaultFilterValue ? undefined : filters.course
		);
		setGender(
			filters.gender === defaultFilterValue ? undefined : filters.gender
		);
		setYear(filters.year === defaultFilterValue ? undefined : filters.year);
	};

	useEffect(() => {
		setPage(1);
	}, [search]);

	if (studentsError || cError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Student List</Header>
				<AddStudentForm />
			</StickyHeader>
			<StudentFilter
				courses={[defaultFilterValue].concat(courses ?? [])}
				onChange={onFilterChange}
			/>
			<StudentsTable
				isLoading={studentsLoading}
				students={studentsFetchResult?.data}
			/>
			{studentsLoading || (cLoading && <p>Loading...</p>)}

			{studentsFetchResult && (
				<Pagination className='pb-5'>
					<PaginationContent>
						<PaginationItem
							onClick={() => {
								if (studentsFetchResult.prev === -1) return;
								setPage(page - 1);
							}}
						>
							<PaginationPrevious />
						</PaginationItem>

						<PaginationItem>
							{studentsFetchResult.prev === -1 ? (
								<PaginationEllipsis />
							) : (
								<PaginationLink>{studentsFetchResult.prev}</PaginationLink>
							)}
						</PaginationItem>

						<PaginationItem>
							<PaginationLink isActive>{page}</PaginationLink>
						</PaginationItem>

						<PaginationItem>
							{studentsFetchResult.next === -1 ? (
								<PaginationEllipsis />
							) : (
								<PaginationLink>{studentsFetchResult.next}</PaginationLink>
							)}
						</PaginationItem>

						<PaginationItem>
							<PaginationNext
								onClick={() => {
									if (studentsFetchResult.next === -1) return;
									setPage(page + 1);
								}}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</SidebarPageLayout>
	);
}
