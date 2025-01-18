import { fetchCategories } from '@/api/category';
import { fetchTransactionByID } from '@/api/transaction';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteTransactionButton from '@/components/buttons/EditAndDeleteTransactionButton';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import TransactionCheque from '@/components/TransactionCheque';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

export default function TransactionInfo() {
	const userRole = useUserStore((state) => state.user?.role);
	const { transactionID } = useParams();
	if (!transactionID) return;

	const {
		data: transaction,
		isLoading: TLoading,
		error: TError,
	} = useQuery({
		queryKey: [QUERY_KEYS.TRANSACTION, { transactionID }],
		queryFn: () => fetchTransactionByID(transactionID),
	});

	const {
		data: categories,
		isLoading: CLoading,
		error: CError,
	} = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	if (TLoading || CLoading) {
		return <p>Loading...</p>;
	}

	if (TError || CError || !transaction || !categories) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			<div className='flex justify-between'>
				<Header>Transaction Details</Header>
				{isAuthorized(userRole, 'governor', 'treasurer', 'auditor') && (
					<EditAndDeleteTransactionButton
						categories={categories}
						transaction={transaction}
					/>
				)}
			</div>
			<hr />
			<TransactionCheque transaction={transaction} />
		</SidebarPageLayout>
	);
}
