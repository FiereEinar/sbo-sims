import {
  fetchOrganizationByID,
  fetchOrganizationCategories,
} from '@/api/organization';
import EditAndDeleteOrganizationButton from '@/components/buttons/EditAndDeleteOrganizationButton';
import OrganizationDetailsLoading from '@/components/loading/OrganizationDetailsLoading';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import OrganizationDetails from '@/components/organization/OrganizationDetails';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import SettingsTabs from '@/components/SettingsTabs';
import StickyHeader from '@/components/StickyHeader';
import { Badge } from '@/components/ui/badge';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { Building2, Layers } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import CategoriesTable from '@/components/category/CategoriesTable';

export default function OrganizationInfo() {
  const { organizationID } = useParams();
  const { user } = useUserStore();
  const orgIdToUse = organizationID ?? user?.organization?._id ?? '';

  const {
    data: organization,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.ORGANIZATION, { organizationID: orgIdToUse }],
    queryFn: () => fetchOrganizationByID(orgIdToUse),
  });

  const {
    data: orgCategories,
    isLoading: cLoading,
    error: cError,
  } = useQuery({
    queryKey: [
      QUERY_KEYS.ORGANIZATION_CATEGORIES,
      { organizationID: orgIdToUse },
    ],
    queryFn: () => fetchOrganizationCategories(orgIdToUse),
  });

  if (error || cError) {
    return <p>Error</p>;
  }

  return (
    <SidebarPageLayout>
      <div className="w-full space-y-6 mx-auto">
        <SettingsTabs />
        {isLoading && <StickyHeaderLoading />}

        {organization && (
          <StickyHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <h1 className="font-semibold text-base leading-tight">
                  {organization.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] rounded-full px-2 h-4 font-normal"
                  >
                    {organization.slug}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Organization Profile
                  </span>
                </div>
              </div>
            </div>
            <EditAndDeleteOrganizationButton
              organizationID={organization._id}
            />
          </StickyHeader>
        )}

        <div className="space-y-6">
          {isLoading && <OrganizationDetailsLoading />}

          {organization && <OrganizationDetails organization={organization} />}

          <div className="rounded-2xl border bg-card/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers size={15} />
              </div>
              <div>
                <h2 className="font-semibold leading-none">Fee Categories</h2>
                {orgCategories && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {orgCategories.length} categor
                    {orgCategories.length !== 1 ? 'ies' : 'y'}
                  </p>
                )}
              </div>
            </div>
            <div className="p-1">
              <CategoriesTable
                categories={orgCategories}
                isLoading={cLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </SidebarPageLayout>
  );
}
