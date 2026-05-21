import { fetchCategoriesWithTransactions } from '@/api/category';
import { fetchAllOrganizations } from '@/api/organization';
import { fetchStudents } from '@/api/student';
import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
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
		const prefetch = async () => {
			try {
				// 1. Prioritize Dashboard Data prefetch and await it so it completes first
				await queryClient.prefetchQuery({
					queryKey: [QUERY_KEYS.DASHBOARD_DATA],
					queryFn: fetchDashboardData,
				});
			} catch (error) {
				console.error('Failed to prefetch dashboard data:', error);
			}

			// 2. Once the dashboard data is loaded, prefetch the remaining values in the background
			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.STUDENT, studentStore.getFilterValues()],
				queryFn: () =>
					fetchStudents(
						studentStore.getFilterValues(),
						studentStore.page,
						studentStore.pageSize
					),
			});

			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.TRANSACTION, transactionStore.getFilterValues()],
				queryFn: () =>
					fetchTransactions(
						transactionStore.getFilterValues(),
						transactionStore.page,
						transactionStore.pageSize
					),
			});

			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
				queryFn: fetchCategoriesWithTransactions,
			});

			queryClient.prefetchQuery({
				queryKey: [QUERY_KEYS.ORGANIZATION],
				queryFn: fetchAllOrganizations,
			});
		};

		prefetch();
	}, []);
}
