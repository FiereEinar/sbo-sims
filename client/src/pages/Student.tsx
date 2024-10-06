import { fetchStudents } from '@/api/student';
import StudentsTable from '@/components/StudentsTable';
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
		<section>
			<h1 className='mb-3 text-lg'>Student List</h1>
			<StudentsTable students={students} />
		</section>
	);
}
