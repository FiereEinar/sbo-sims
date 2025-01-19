import { fetchCategories } from '@/api/category';
import { fetchTransactionByID } from '@/api/transaction';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteTransactionButton from '@/components/buttons/EditAndDeleteTransactionButton';
import BouncyLoading from '@/components/loading/BouncyLoading';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
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

	if (TError || CError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			{CLoading || (TLoading && <StickyHeaderLoading />)}
			{categories && transaction && (
				<StickyHeader>
					<Header>Transaction Details</Header>
					{isAuthorized(userRole, 'governor', 'treasurer', 'auditor') && (
						<EditAndDeleteTransactionButton
							categories={categories}
							transaction={transaction}
						/>
					)}
				</StickyHeader>
			)}
			<hr />
			{CLoading || (TLoading && <BouncyLoading />)}
			{transaction && <TransactionCheque transaction={transaction} />}
		</SidebarPageLayout>
	);
}
