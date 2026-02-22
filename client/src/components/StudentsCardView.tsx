import { StudentWithTransactions } from '@/types/student';
import StudentCard from './cards/StudentCard';

interface StudentsCardViewProps {
	students: StudentWithTransactions[] | undefined;
	isLoading: boolean;
}

export default function StudentsCardView({
	students,
	isLoading,
}: StudentsCardViewProps) {
	if (isLoading) {
		return <div className='text-center py-10'>Loading students...</div>;
	}

	if (!students?.length) {
		return <div className='text-center py-10'>No students found</div>;
	}

	return (
		<div className='grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2'>
			{students.map((student) => (
				<StudentCard key={student._id} student={student} />
			))}
		</div>
	);
}
