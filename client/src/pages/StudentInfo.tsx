import { fetchStudentByID, fetchStudentTransactions } from '@/api/student';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteStudentButton from '@/components/buttons/EditAndDeleteStudentButton';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import StudentDataCardLoading from '@/components/loading/StudentDataCardLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentDataCard from '@/components/StudentDataCard';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function StudentInfo() {
	const { studentID } = useParams();
	if (studentID === undefined) return;

	const {
		data: student,
		isLoading: studentLoading,
		error: studentError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, { studentID }],
		queryFn: () => fetchStudentByID(studentID),
	});

	const {
		data: transactions,
		isLoading: txLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_TRANSACTIONS, { studentID }],
		queryFn: () => fetchStudentTransactions(studentID),
	});

	if (studentError || transactionsError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />

			{studentLoading && <StickyHeaderLoading />}

			{student && (
				<StickyHeader>
					<Header>Student Information</Header>
					<EditAndDeleteStudentButton student={student} />
				</StickyHeader>
			)}

			<div className='space-y-6'>
				{studentLoading && <StudentDataCardLoading />}

				{student && <StudentDataCard student={student} />}

				<div className='rounded-2xl border bg-card/50 p-6 shadow-sm'>
					<h2 className='font-semibold mb-4'>Transaction History</h2>
					<TransactionsTable
						isLoading={txLoading}
						transactions={transactions}
					/>
				</div>
			</div>
		</SidebarPageLayout>
	);
}
