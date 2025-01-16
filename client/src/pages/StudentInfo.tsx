import { fetchStudentByID, fetchStudentTransactions } from '@/api/student';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteStudentButton from '@/components/buttons/EditAndDeleteStudentButton';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import StudentDataCard from '@/components/StudentDataCard';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function StudentInfo() {
	const userRole = useUserStore((state) => state.user?.role);
	const { studentID } = useParams();
	if (studentID === undefined) return;

	const {
		data: studentData,
		isLoading: studentLoading,
		error: studentError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT, { studentID }],
		queryFn: () => fetchStudentByID(studentID),
	});

	const {
		data: studentTransactions,
		isLoading: transactionsLoading,
		error: transactionsError,
	} = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_TRANSACTIONS, { studentID }],
		queryFn: () => fetchStudentTransactions(studentID),
	});

	if (studentLoading) {
		return <p>Loading...</p>;
	}

	if (studentError || transactionsError) {
		return <p>Error</p>;
	}

	if (!studentData) {
		return <p>No student found</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			<div className='space-y-3'>
				<StickyHeader>
					<Header>Student Info</Header>
					{isAuthorized(userRole, 'governor', 'treasurer') && (
						<EditAndDeleteStudentButton student={studentData} />
					)}
				</StickyHeader>

				<hr />

				<StudentDataCard studentID={studentID} studentData={studentData} />

				<hr />

				<div>
					<h1 className='text-muted-foreground'>Previous transactions made:</h1>
					<TransactionsTable
						isLoading={transactionsLoading}
						transactions={studentTransactions}
					/>
				</div>
			</div>
		</SidebarPageLayout>
	);
}
