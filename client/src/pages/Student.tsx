import { fetchStudents } from '@/api/student';
import { AddStudentForm } from '@/components/forms/AddStudentForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentsTable from '@/components/StudentsTable';
import Header from '@/components/ui/header';
import { useQuery } from '@tanstack/react-query';

export default function Student() {
	const {
		data: students,
		isLoading: studentsLoading,
		error: studentsError,
	} = useQuery({
		queryKey: ['students'],
		queryFn: fetchStudents,
	});

	if (studentsLoading) {
		return <p>Loading...</p>;
	}

	if (studentsError || students === undefined) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Student List</Header>
				<AddStudentForm />
			</StickyHeader>
			<StudentsTable students={students} />
		</SidebarPageLayout>
	);
}
