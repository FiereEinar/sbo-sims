import axiosInstance from '@/api/axiosInstance';
import UsersCardView from '@/components/user/UsersCardView';
import { AddUserForm } from '@/components/forms/AddUserForm';
import HasPermission from '@/components/HasPermission';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import SettingsTabs from '@/components/SettingsTabs';
import StickyHeader from '@/components/StickyHeader';
import UsersTable from '@/components/user/UsersTable';
import { MODULES, QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { useViewModeStore } from '@/store/viewModeStore';
import { APIPaginatedResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Users2 } from 'lucide-react';

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
      <div className="w-full space-y-6 mx-auto">
        <SettingsTabs />
        <StickyHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users2 size={16} />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight">
                Officers
              </h1>
              {response && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {response.data?.length ?? 0} member
                  {(response.data?.length ?? 0) !== 1 ? 's' : ''} on this page
                </p>
              )}
            </div>
          </div>

          <HasPermission permissions={[MODULES.USER_CREATE]}>
            <AddUserForm />
          </HasPermission>
        </StickyHeader>

        <div className="rounded-2xl border bg-card/50 shadow-sm overflow-hidden">
          <div>
            {viewMode === 'table' ? (
              <UsersTable users={response?.data ?? []} isLoading={isLoading} />
            ) : (
              <div className="p-4">
                <UsersCardView
                  users={response?.data ?? []}
                  isLoading={isLoading}
                />
              </div>
            )}
          </div>
        </div>

        {response && (
          <PaginationController
            currentPage={page}
            nextPage={response?.next}
            prevPage={response?.prev}
            setPage={setPage}
            prefetchFn={prefetchPageFn}
          />
        )}
      </div>
    </SidebarPageLayout>
  );
}
