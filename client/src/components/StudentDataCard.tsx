import { Student } from '@/types/student';

interface StudentDataCardProps {
	studentID: string;
	studentData: Student;
}

export default function StudentDataCard({
	studentID,
	studentData,
}: StudentDataCardProps) {
	return (
		<div className='text-muted-foreground'>
			<p>Student ID: {studentID}</p>
			<p>Full name: {`${studentData.firstname} ${studentData.lastname}`}</p>
			<p>Email: {studentData.email || 'Not provided'}</p>
		</div>
	);
}
