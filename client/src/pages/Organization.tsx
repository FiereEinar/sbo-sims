import { fetchAllOrganizations } from '@/api/organization';
import AddOrganizationForm from '@/components/forms/AddOrganizationForm';
import HasPermission from '@/components/HasPermission';
import OrganizationTable from '@/components/OrganizationTable';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';

export default function Organization() {
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

				<HasPermission permissions={[MODULES.ORGANIZATION_CREATE]}>
					<AddOrganizationForm />
				</HasPermission>
			</StickyHeader>

			<OrganizationTable organizations={organizations} isLoading={isLoading} />
		</SidebarPageLayout>
	);
}
