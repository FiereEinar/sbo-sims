import { fetchCategoriesWithTransactions } from '@/api/category';
import { fetchAllOrganizations } from '@/api/organization';
import { fetchStudents } from '@/api/student';
import { fetchTransactions } from '@/api/transaction';
import { QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { useStudentFilterStore } from '@/store/studentsFilter';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useEffect } from 'react';

/**
 * Prefetch values for the application
 */
export function usePefetchValues() {
	const studentStore = useStudentFilterStore((state) => state);
	const transactionStore = useTransactionFilterStore((state) => state);

	useEffect(() => {
		(async () => {
			// prefetch students
			await queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.STUDENT, studentStore.getFilterValues()],
				queryFn: () =>
					fetchStudents(
						studentStore.getFilterValues(),
						studentStore.page,
						studentStore.pageSize
					),
			});

			//prefetch transactions
			await queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.TRANSACTION, transactionStore.getFilterValues()],
				queryFn: () =>
					fetchTransactions(
						transactionStore.getFilterValues(),
						transactionStore.page,
						transactionStore.pageSize
					),
			});
			// prefetch categories
			await queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
				queryFn: fetchCategoriesWithTransactions,
			});

			// prefetch organizations
			await queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.ORGANIZATION],
				queryFn: fetchAllOrganizations,
			});
		})();
	}, []);
}
