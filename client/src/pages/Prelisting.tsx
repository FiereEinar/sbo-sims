import { fetchCategories } from '@/api/category';
import { fetchPrelistings } from '@/api/prelisting';
import PrelistingFilter from '@/components/prelisting/PrelistingFilter';
import AddPrelistingForm from '@/components/forms/AddPrelistingForm';
import HasPermission from '@/components/HasPermission';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import PrelistingTable from '@/components/prelisting/PrelistingTable';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { usePrelistingFilterStore } from '@/store/prelistingFilter';
import { PrelistingFilterValues } from '@/types/prelisting';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@/store/user';
import { AlertCircle } from 'lucide-react';

export default function Prelisting() {
  const user = useUserStore((state) => state.user);
  const { page, pageSize, getFilterValues, setPage } = usePrelistingFilterStore(
    (state) => state,
  );

  const {
    data: fetchPrelistingsResult,
    isLoading: prelistingLoading,
    error: prelistingError,
  } = useQuery({
    queryKey: [QUERY_KEYS.PRELISTING, getFilterValues()],
    queryFn: () => fetchPrelistings(getFilterValues(), page, pageSize),
  });

  const { data: categories, error: categoriesError } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORY],
    queryFn: fetchCategories,
  });

  const prefetchPageFn = (page: number) => {
    const filters: PrelistingFilterValues = {
      ...getFilterValues(),
      page: page,
    };

    // check if it was already prefetched
    const data = queryClient.getQueryData([QUERY_KEYS.PRELISTING, filters]);
    if (data) return;

    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.PRELISTING, filters],
      queryFn: () => fetchPrelistings(filters, page, pageSize),
    });
  };

  if (prelistingError || categoriesError) {
    return <p>Session expired, login again.</p>;
  }

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <div className="flex flex-col gap-1">
          <Header>Prelistings</Header>
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            Showing data for{' '}
            <strong>
              SY {user?.activeSchoolYearDB} — Semester {user?.activeSemDB}
            </strong>
          </div>
        </div>

        <HasPermission permissions={[MODULES.PRELISTING_CREATE]}>
          <AddPrelistingForm categories={categories} />
        </HasPermission>
      </StickyHeader>

      <div className="flex justify-between items-end flex-wrap gap-3">
        <PrelistingFilter />
      </div>
      <PrelistingTable
        isLoading={prelistingLoading}
        prelistings={fetchPrelistingsResult?.data}
      />

      {fetchPrelistingsResult && (
        <PaginationController
          currentPage={page ?? 1}
          nextPage={fetchPrelistingsResult.next}
          prevPage={fetchPrelistingsResult.prev}
          setPage={setPage}
          prefetchFn={prefetchPageFn}
        />
      )}
    </SidebarPageLayout>
  );
}
