import axiosInstance from '@/api/axiosInstance';
import { AddUserForm } from '@/components/forms/AddUserForm';
import HasPermission from '@/components/HasPermission';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import UsersTable from '@/components/UsersTable';
import { MODULES, QUERY_KEYS } from '@/constants';
import { APIPaginatedResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function Users() {
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

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Users</Header>

				<HasPermission permissions={[MODULES.USER_CREATE]}>
					<AddUserForm />
				</HasPermission>
			</StickyHeader>

			<UsersTable users={response?.data ?? []} isLoading={isLoading} />

			{response && (
				<div className='md:absolute w-full p-5 md:bottom-0'>
					<PaginationController
						currentPage={page}
						nextPage={response?.next}
						prevPage={response?.prev}
						setPage={setPage}
						// prefetchFn={prefetchPageFn}
					/>
				</div>
			)}
		</SidebarPageLayout>
	);
}
