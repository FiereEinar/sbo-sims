import { fetchCategoriesWithTransactions } from '@/api/category';
import CategoriesCardView from '@/components/category/CategoriesCardView';
import AddCategoryForm from '@/components/forms/AddCategoryForm';
import HasPermission from '@/components/HasPermission';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import ViewModeToggle from '@/components/ViewModeToggle';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useViewModeStore } from '@/store/viewModeStore';
import { useQuery } from '@tanstack/react-query';

import SemInput from '@/components/SemInput';
import SchoolYearInput from '@/components/SchoolYearInput';
import CategoriesTable from '@/components/category/CategoriesTable';

export default function Category() {
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
        <Header>Categories</Header>
        <HasPermission permissions={[MODULES.CATEGORY_CREATE]}>
          <AddCategoryForm />
        </HasPermission>
      </StickyHeader>

      <div className="flex justify-between items-end flex-wrap gap-3 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-[130px]">
            <SemInput />
          </div>
          <div className="w-[150px]">
            <SchoolYearInput />
          </div>
        </div>
        <ViewModeToggle />
      </div>

      {viewMode === 'table' ? (
        <CategoriesTable categories={categories} isLoading={isLoading} />
      ) : (
        <CategoriesCardView categories={categories} isLoading={isLoading} />
      )}
    </SidebarPageLayout>
  );
}
