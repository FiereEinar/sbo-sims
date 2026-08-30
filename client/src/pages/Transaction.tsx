import { fetchCategories } from '@/api/category';
import { fetchTransactions } from '@/api/transaction';
import AddTransactionForm from '@/components/forms/AddTransactionForm';
import PaginationController from '@/components/PaginationController';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { queryClient } from '@/main';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { TransactionsFilterValues } from '@/types/transaction';
import { useQuery } from '@tanstack/react-query';
import HasPermission from '@/components/HasPermission';
import { useViewModeStore } from '@/store/viewModeStore';
import TransactionsCardView from '@/components/transaction/TransactionsCardView';
import TransactionsTable from '@/components/transaction/TransactionsTable';
import TransactionsFilter from '@/components/transaction/TransactionsFilter';
import { useUserStore } from '@/store/user';
import { AlertCircle, Import } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Transaction() {
  const user = useUserStore((state) => state.user);
  const { viewMode } = useViewModeStore();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { page, pageSize, getFilterValues, setPage } =
    useTransactionFilterStore((state) => state);

  const {
    data: fetchTransactionsResult,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTION, getFilterValues()],
    queryFn: () => fetchTransactions(getFilterValues(), page, pageSize),
  });

  const { data: categories, error: categoriesError } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORY],
    queryFn: fetchCategories,
  });

  const prefetchPageFn = (page: number) => {
    const filters: TransactionsFilterValues = {
      ...getFilterValues(),
      page: page,
    };

    // check if it was already prefetched
    const data = queryClient.getQueryData([QUERY_KEYS.TRANSACTION, filters]);
    if (data) return;

    queryClient.prefetchQuery({
      queryKey: [QUERY_KEYS.TRANSACTION, filters],
      queryFn: () => fetchTransactions(filters, page, pageSize),
    });
  };

  if (transactionsError || categoriesError) {
    return <p>Session expired, login again.</p>;
  }

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <div className="flex flex-col gap-1">
          <Header>Transactions</Header>
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            Showing data for{' '}
            <strong>
              SY {user?.activeSchoolYearDB} — Semester {user?.activeSemDB}
            </strong>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <HasPermission permissions={[MODULES.TRANSACTION_IMPORT]}>
            <Button
              asChild
              className="rounded-full flex items-center gap-2"
              variant="ghost"
            >
              <Link to={`/${orgSlug}/transaction/import`}>
                <Import className="size-4" />
                Import
              </Link>
            </Button>
          </HasPermission>
          <HasPermission permissions={[MODULES.TRANSACTION_CREATE]}>
            <AddTransactionForm categories={categories} />
          </HasPermission>
        </div>
      </StickyHeader>

      <div className="flex justify-between items-end flex-wrap gap-3">
        <TransactionsFilter />
        {/* <ViewModeToggle /> */}
      </div>

      {viewMode === 'table' ? (
        <TransactionsTable
          isLoading={transactionsLoading}
          transactions={fetchTransactionsResult?.data}
        />
      ) : (
        <TransactionsCardView
          transactions={fetchTransactionsResult?.data}
          isLoading={transactionsLoading}
        />
      )}

      {fetchTransactionsResult && (
        <PaginationController
          currentPage={page ?? 1}
          nextPage={fetchTransactionsResult.next}
          prevPage={fetchTransactionsResult.prev}
          setPage={setPage}
          prefetchFn={prefetchPageFn}
        />
      )}
    </SidebarPageLayout>
  );
}
