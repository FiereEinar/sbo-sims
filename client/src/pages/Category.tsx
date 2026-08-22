import { fetchCategoriesWithTransactions } from '@/api/category';
import CategoriesCardView from '@/components/category/CategoriesCardView';
import AddCategoryForm from '@/components/forms/AddCategoryForm';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useViewModeStore } from '@/store/viewModeStore';
import { useQuery } from '@tanstack/react-query';

import SemInput from '@/components/SemInput';
import SchoolYearInput from '@/components/SchoolYearInput';
import { AlertCircle, Filter } from 'lucide-react';
import { useUserStore } from '@/store/user';
import CategoriesTable from '@/components/category/CategoriesTable';

export default function Category() {
  const user = useUserStore((state) => state.user);
  const { viewMode } = useViewModeStore();

  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
    queryFn: fetchCategoriesWithTransactions,
  });

  if (error) {
    return <p>Session expired, login again.</p>;
  }

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <div className="flex flex-col gap-1">
          <Header>Categories</Header>
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            Showing data for{' '}
            <strong>
              SY {user?.activeSchoolYearDB} — Semester {user?.activeSemDB}
            </strong>
          </div>
        </div>
        <HasPermission permissions={[MODULES.CATEGORY_CREATE]}>
          <AddCategoryForm />
        </HasPermission>
      </StickyHeader>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full mt-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
          <Filter className="w-4 h-4 shrink-0" />
          <span className="font-bold tracking-wide uppercase text-xs shrink-0">
            Filter
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 w-full lg:w-auto">
          <div className="w-full sm:w-[130px]">
            <SemInput hideLabel />
          </div>
          <div className="w-full sm:w-[150px]">
            <SchoolYearInput hideLabel />
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <CategoriesTable categories={categories} isLoading={isLoading} />
      ) : (
        <CategoriesCardView categories={categories} isLoading={isLoading} />
      )}
    </SidebarPageLayout>
  );
}
