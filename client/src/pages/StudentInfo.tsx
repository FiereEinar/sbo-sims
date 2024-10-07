import { fetchStudentByID, fetchStudentTransactions } from '@/api/student';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteButton from '@/components/buttons/EditAndDeleteButton';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StudentDataCard from '@/components/StudentDataCard';
import TransactionsTable from '@/components/TransactionsTable';
import { Button } from '@/components/ui/button';
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
		<SidebarPageLayout>
			<BackButton />
			<div className='space-y-3'>
				<div className='flex justify-between'>
					<h1 className='text-2xl'>Student Info</h1>

					<EditAndDeleteButton />
				</div>

				<hr />

				<StudentDataCard studentID={studentID} studentData={studentData} />

				<hr />

				<div>
					<h1 className='text-muted-foreground'>Previous transactions made:</h1>
					<TransactionsTable transactions={studentTransactions} />
				</div>
			</div>
		</SidebarPageLayout>
	);
}
