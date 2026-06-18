import { fetchAllOrganizations } from '@/api/organization';
import OrganizationsCardView from '@/components/organization/OrganizationsCardView';
import AddOrganizationForm from '@/components/forms/AddOrganizationForm';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import OrganizationTable from '@/components/organization/OrganizationTable';
import Header from '@/components/ui/header';
import ViewModeToggle from '@/components/ViewModeToggle';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useViewModeStore } from '@/store/viewModeStore';
import { useQuery } from '@tanstack/react-query';

export default function Organization() {
  const { viewMode } = useViewModeStore();

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

      <div className="flex justify-between items-center">
        <div />
        <ViewModeToggle />
      </div>

      {viewMode === 'table' ? (
        <OrganizationTable
          organizations={organizations}
          isLoading={isLoading}
        />
      ) : (
        <OrganizationsCardView
          organizations={organizations}
          isLoading={isLoading}
        />
      )}
    </SidebarPageLayout>
  );
}
