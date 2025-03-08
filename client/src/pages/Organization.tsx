import { fetchAllOrganizations } from '@/api/organization';
import AddOrganizationForm from '@/components/forms/AddOrganizationForm';
import OrganizationTable from '@/components/OrganizationTable';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';

export default function Organization() {
	const userRole = useUserStore((state) => state.user?.role);
	const {
		data: organizations,
		isLoading,
		error,
	} = useQuery({
		queryKey: [QUERY_KEYS.ORGANIZATION],
		queryFn: fetchAllOrganizations,
	});

	if (error) {
		return <p>Session expired, login again.</p>;
	}

	return (
		<SidebarPageLayout>
			<StickyHeader>
				<Header>Organizations</Header>
				{isAuthorized(userRole, 'governor') && <AddOrganizationForm />}
			</StickyHeader>

			<OrganizationTable organizations={organizations} isLoading={isLoading} />
		</SidebarPageLayout>
	);
}
