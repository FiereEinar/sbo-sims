import {
	fetchOrganizationByID,
	fetchOrganizationCategories,
} from '@/api/organization';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteOrganizationButton from '@/components/buttons/EditAndDeleteOrganizationButton';
import CategoriesTable from '@/components/CategoriesTable';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/ui/header';
import { QUERY_KEYS } from '@/constants';
import { isAuthorized } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useParams } from 'react-router-dom';

export default function OrganizationInfo() {
	const userRole = useUserStore((state) => state.user?.role);
	const { organizationID } = useParams();

	const {
		data: organization,
		isLoading,
		error,
	} = useQuery({
		queryKey: [QUERY_KEYS.ORGANIZATION, { organizationID }],
		queryFn: () => fetchOrganizationByID(organizationID ?? ''),
	});

	const {
		data: orgCategories,
		isLoading: cLoading,
		error: cError,
	} = useQuery({
		queryKey: [QUERY_KEYS.ORGANIZATION_CATEGORIES, { organizationID }],
		queryFn: () => fetchOrganizationCategories(organizationID ?? ''),
	});

	if (isLoading || cLoading) {
		return <p>Loading...</p>;
	}

	if (error || cError || !organization || !orgCategories) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />
			<StickyHeader>
				<Header>{organization.name}</Header>
				{isAuthorized(userRole, 'governor') && (
					<EditAndDeleteOrganizationButton organizationID={organization._id} />
				)}
			</StickyHeader>
			<hr />
			<div>
				<p className='text-muted-foreground'>
					Governor: {_.startCase(organization.governor)}
				</p>
				<p className='text-muted-foreground'>
					Treasurer: {_.startCase(organization.treasurer)}
				</p>
				<div className='text-muted-foreground flex gap-1 my-1'>
					<span>Departments:</span>
					{organization.departments.map((department, i) => (
						<Badge key={i}>{department}</Badge>
					))}
				</div>
			</div>
			<CategoriesTable categories={orgCategories} />
		</SidebarPageLayout>
	);
}
