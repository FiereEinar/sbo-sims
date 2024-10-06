import { fetchStudentByID, fetchStudentTransactions } from '@/api/student';
import BackButton from '@/components/buttons/BackButton';
import TransactionsTable from '@/components/TransactionsTable';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function StudentInfo() {
	const { studentID } = useParams();
	if (studentID === undefined) return;

	const {
		data: studentData,
		isLoading: studentLoading,
		error: studentError,
	} = useQuery({
		queryKey: [`student_${studentID}`],
		queryFn: () => fetchStudentByID(studentID),
	});

	const {
		data: studentTransactions,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [`student_${studentID}_transactions`],
		queryFn: () => fetchStudentTransactions(studentID),
	});

	if (studentLoading || transactionsLoading) {
		return <p>Loading...</p>;
	}

	if (studentError || transactionsError) {
		return <p>Error</p>;
	}

	if (!studentData || !studentTransactions) {
		return <p>Error</p>;
	}

	console.log(studentData);
	console.log(studentTransactions);

	return (
		<section className='space-y-3'>
			<BackButton />
			<div className='space-y-3'>
				<div className='text-muted-foreground'>
					<p>Student ID: {studentID}</p>
					<p>Full name: {`${studentData.firstname} ${studentData.lastname}`}</p>
					<p>Email: {studentData.email || 'Not provided'}</p>
				</div>
				<TransactionsTable transactions={studentTransactions} />
			</div>
		</section>
	);
}
