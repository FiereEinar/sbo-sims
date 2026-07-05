import { fetchCategoryStudentStatus } from '@/api/category';
import BackButton from '@/components/buttons/BackButton';
import DownloadCategoryStudentStatusButton from '@/components/buttons/DownloadCategoryStudentStatusButton';
import EditAndDeleteCategoryButton from '@/components/buttons/EditAndDeleteCategoryButton';
import HasPermission from '@/components/HasPermission';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import CategoryStudentStatusTable from '@/components/category/CategoryStudentStatusTable';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CategoryDataCard from '@/components/category/CategoryDataCard';
import TransactionsFilter from '@/components/transaction/TransactionsFilter';
import AddTransactionForm from '@/components/forms/AddTransactionForm';

const pageSize = 10;

export default function CategoryInfo() {
  const { categoryID } = useParams();
  if (!categoryID) return;

  const { getFilterValues, setStatus } = useTransactionFilterStore(
    (state) => state,
  );
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      QUERY_KEYS.CATEGORY,
      { ...getFilterValues(), categoryID, page, pageSize },
    ],
    queryFn: () =>
      fetchCategoryStudentStatus(getFilterValues(), categoryID, page, pageSize),
  });

  // set default filter value of status to paid, if this is updated, also update the TableHeadStatusFilter in CategoryStudentStatusTable
  useEffect(() => {
    if (categoryID) setStatus('paid');
  }, [setStatus, categoryID]);

  if (error) {
    return <p>Session expired, login again</p>;
  }

  return (
    <SidebarPageLayout>
      <BackButton />
      {isLoading && <StickyHeaderLoading />}
      {data?.data && (
        <StickyHeader>
          <CategoryDataCard category={data.data.category} />
          <div className="flex flex-col items-start sm:items-end space-y-2">
            <div className="flex gap-2">
              <HasPermission permissions={[MODULES.TRANSACTION_DOWNLOAD]}>
                <DownloadCategoryStudentStatusButton categoryID={categoryID} />
              </HasPermission>
              <HasPermission permissions={[MODULES.TRANSACTION_CREATE]}>
                <AddTransactionForm
                  categories={[data.data.category]}
                  autoselect
                />
              </HasPermission>
            </div>

            <EditAndDeleteCategoryButton category={data.data.category} />
          </div>
        </StickyHeader>
      )}

      <TransactionsFilter />

      <CategoryStudentStatusTable
        isLoading={isLoading}
        students={data?.data?.students}
      />

      {data && (
        <PaginationController
          currentPage={page ?? 1}
          nextPage={data.next}
          prevPage={data.prev}
          setPage={setPage}
        />
      )}
    </SidebarPageLayout>
  );
}
