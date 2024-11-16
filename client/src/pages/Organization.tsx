import { fetchAllOrganizations } from '@/api/organization';
import AddOrganizationForm from '@/components/forms/AddOrganizationForm';
import OrganizationTable from '@/components/OrganizationTable';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
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

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (error || !organizations) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Organizations</Header>
				{userRole === 'admin' && <AddOrganizationForm />}
			</StickyHeader>

			<OrganizationTable organizations={organizations} />
		</SidebarPageLayout>
	);
}
