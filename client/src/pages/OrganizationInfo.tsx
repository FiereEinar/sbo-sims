import {
	fetchOrganizationByID,
	fetchOrganizationCategories,
} from '@/api/organization';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteOrganizationButton from '@/components/buttons/EditAndDeleteOrganizationButton';
import CategoriesTable from '@/components/CategoriesTable';
import OrganizationDetailsLoading from '@/components/loading/OrganizationDetailsLoading';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import OrganizationDetails from '@/components/OrganizationDetails';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
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

	if (error || cError) {
		return <p>Error</p>;
	}

	return (
		<SidebarPageLayout>
			<BackButton />

			{isLoading && <StickyHeaderLoading />}

			{organization && (
				<StickyHeader>
					<Header>{organization.name}</Header>
					{isAuthorized(userRole, 'governor') && (
						<EditAndDeleteOrganizationButton
							organizationID={organization._id}
						/>
					)}
				</StickyHeader>
			)}

			<div className='space-y-6'>
				{isLoading && <OrganizationDetailsLoading />}

				{organization && <OrganizationDetails organization={organization} />}

				<div className='rounded-2xl border bg-card/50 p-6 shadow-sm'>
					<h2 className='font-semibold mb-4'>Categories</h2>
					<CategoriesTable categories={orgCategories} isLoading={cLoading} />
				</div>
			</div>
		</SidebarPageLayout>
	);
}
