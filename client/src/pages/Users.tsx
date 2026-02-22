import axiosInstance from '@/api/axiosInstance';
import { AddUserForm } from '@/components/forms/AddUserForm';
import HasPermission from '@/components/HasPermission';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import UsersCardView from '@/components/UsersCardView';
import UsersTable from '@/components/UsersTable';
import ViewModeToggle from '@/components/ViewModeToggle';
import { MODULES, QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { useViewModeStore } from '@/store/viewModeStore';
import { APIPaginatedResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Users() {
	const { viewMode } = useViewModeStore();
	const [page, setPage] = useState(1);

	const { data: response, isLoading } = useQuery({
		queryKey: [QUERY_KEYS.USERS, { page }],
		queryFn: async (): Promise<APIPaginatedResponse<User[]>> => {
			const { data } = await axiosInstance.get(
				'/user' + `?page=${page}&pageSize=10`,
			);
			return data;
		},
	});

	const prefetchPageFn = (page: number) => {
		const filters = {
			page: page,
		};

		// check if it was already prefetched
		const data = queryClient.getQueryData([QUERY_KEYS.USERS, filters]);
		if (data) return;

		queryClient.prefetchQuery({
			queryKey: [QUERY_KEYS.USERS, filters],
			queryFn: async (): Promise<APIPaginatedResponse<User[]>> => {
				const { data } = await axiosInstance.get(
					'/user' + `?page=${page}&pageSize=10`,
				);
				return data;
			},
		});
	};

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Users</Header>

				<HasPermission permissions={[MODULES.USER_CREATE]}>
					<AddUserForm />
				</HasPermission>
			</StickyHeader>

			<div className='flex justify-between items-center'>
				<div />
				<ViewModeToggle />
			</div>

			{viewMode === 'table' ? (
				<UsersTable users={response?.data ?? []} isLoading={isLoading} />
			) : (
				<UsersCardView users={response?.data ?? []} isLoading={isLoading} />
			)}

			{response && (
				<PaginationController
					currentPage={page}
					nextPage={response?.next}
					prevPage={response?.prev}
					setPage={setPage}
					prefetchFn={prefetchPageFn}
				/>
			)}
		</SidebarPageLayout>
	);
}
