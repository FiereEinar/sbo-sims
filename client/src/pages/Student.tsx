import { fetchStudents } from '@/api/student';
import { AddStudentForm } from '@/components/forms/AddStudentForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentFilter from '@/components/StudentFilter';
import StudentsTable from '@/components/StudentsTable';
import Header from '@/components/ui/header';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import PaginationController from '@/components/PaginationController';
import { useStudentFilterStore } from '@/store/studentsFilter';
import { useUserStore } from '@/store/user';
import ImportStudentsButton from '@/components/buttons/ImportStudentsButton';
import { isAuthorized } from '@/lib/utils';

export default function Student() {
	const userRole = useUserStore((state) => state.user?.role);
	const { page, pageSize, setPage, getFilterValues } = useStudentFilterStore(
		(state) => state
	);

	const {
		data: studentsFetchResult,
		isLoading: studentsLoading,
		error: studentsError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, getFilterValues()],
		queryFn: () => fetchStudents(getFilterValues(), page, pageSize),
	});

	if (studentsError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Students</Header>
				{isAuthorized(userRole, 'governor', 'treasurer') && <AddStudentForm />}
			</StickyHeader>
			<div className='flex justify-between items-end flex-wrap gap-3'>
				<StudentFilter />
				{isAuthorized(userRole, 'governor', 'treasurer') && (
					<ImportStudentsButton />
				)}
			</div>
			<StudentsTable
				isLoading={studentsLoading}
				students={studentsFetchResult?.data}
			/>
			{studentsLoading && <p>Loading...</p>}

			{studentsFetchResult && (
				<div className='md:absolute w-full p-5 md:bottom-0'>
					<PaginationController
						currentPage={page ?? 1}
						nextPage={studentsFetchResult.next}
						prevPage={studentsFetchResult.prev}
						setPage={setPage}
					/>
				</div>
			)}
		</SidebarPageLayout>
	);
}
