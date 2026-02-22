import { fetchStudents } from '@/api/student';
import { AddStudentForm } from '@/components/forms/AddStudentForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentFilter from '@/components/StudentFilter';
import StudentsTable from '@/components/StudentsTable';
import Header from '@/components/ui/header';
import { useQuery } from '@tanstack/react-query';
import { MODULES, QUERY_KEYS } from '@/constants';
import PaginationController from '@/components/PaginationController';
import { useStudentFilterStore } from '@/store/studentsFilter';
import ImportStudentsButtonSmart from '@/components/buttons/ImportStudentsButtonSmart';
import { queryClient } from '@/main';
import HasPermission from '@/components/HasPermission';

export default function Student() {
	const { page, pageSize, setPage, getFilterValues } = useStudentFilterStore(
		(state) => state,
	);

	const {
		data: studentsFetchResult,
		isLoading: studentsLoading,
		error: studentsError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, getFilterValues()],
		queryFn: () => fetchStudents(getFilterValues(), page, pageSize),
	});

	const prefetchPageFn = (page: number) => {
		const filters = {
			...getFilterValues(),
			page: page,
		};

		const data = queryClient.getQueryData([QUERY_KEYS.STUDENT, filters]);
		if (data) return;

		queryClient.prefetchQuery({
			queryKey: [QUERY_KEYS.STUDENT, filters],
			queryFn: () => fetchStudents(filters, page, pageSize),
		});
	};

	if (studentsError) {
		return <p>Session expired, login again.</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Students</Header>

				<HasPermission permissions={[MODULES.STUDENT_CREATE]}>
					<AddStudentForm />
				</HasPermission>
			</StickyHeader>
			<div className='flex justify-between items-end flex-wrap gap-3'>
				<StudentFilter />
				<HasPermission permissions={[MODULES.STUDENT_IMPORT]}>
					<ImportStudentsButtonSmart />
				</HasPermission>
			</div>
			<StudentsTable
				isLoading={studentsLoading}
				students={studentsFetchResult?.data}
			/>

			{studentsFetchResult && (
				<PaginationController
					currentPage={page ?? 1}
					nextPage={studentsFetchResult.next}
					prevPage={studentsFetchResult.prev}
					setPage={setPage}
					prefetchFn={prefetchPageFn}
				/>
			)}
		</SidebarPageLayout>
	);
}
