import { Student } from '@/types/student';
import _ from 'lodash';

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
			<p>
				Full name:{' '}
				{_.startCase(
					`${studentData.firstname} ${studentData.middlename ?? ''} ${
						studentData.lastname
					}`.toLowerCase()
				)}
			</p>
			<p>Email: {studentData.email || 'Not provided'}</p>
		</div>
	);
}
