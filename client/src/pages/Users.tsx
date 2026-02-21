import axiosInstance from '@/api/axiosInstance';
import { AddUserForm } from '@/components/forms/AddUserForm';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import UsersTable from '@/components/UsersTable';
import { MODULES, QUERY_KEYS } from '@/constants';
import { User } from '@/types/user';
import { useQuery } from '@tanstack/react-query';

export default function Users() {
	const { data: users, isLoading } = useQuery({
		queryKey: [QUERY_KEYS.USERS],
		queryFn: async (): Promise<User[]> => {
			const { data } = await axiosInstance.get('/user');
			return data.data;
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

			<UsersTable users={users} isLoading={isLoading} />
		</SidebarPageLayout>
	);
}
