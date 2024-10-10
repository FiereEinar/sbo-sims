import { fetchTransactionByID } from '@/api/transaction';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteButton from '@/components/buttons/EditAndDeleteButton';
import UpdateTransactionAmountForm from '@/components/forms/UpdateTransactionAmountForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StudentDataCard from '@/components/StudentDataCard';
import TransactionDataCard from '@/components/TransactionDataCard';
import TransactionsTable from '@/components/TransactionsTable';
import Header from '@/components/ui/header';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function TransactionInfo() {
	const { transactionID } = useParams();
	if (!transactionID) return;

	const { data, isLoading, error } = useQuery({
		queryKey: [`transaction_${transactionID}`],
		queryFn: () => fetchTransactionByID(transactionID),
	});

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (error || !data) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<BackButton />
			<div className='flex justify-between'>
				<Header>Transaction Details</Header>
				<EditAndDeleteButton />
			</div>
			<hr />
			<TransactionDataCard transaction={data} />

			<Header>Transaction Owner</Header>
			<hr />
			<StudentDataCard
				studentID={data.owner.studentID}
				studentData={data.owner}
			/>
			<hr />
			<div className='flex justify-end'>
				<UpdateTransactionAmountForm transaction={data} />
			</div>
			<TransactionsTable transactions={[data]} />
		</SidebarPageLayout>
	);
}
