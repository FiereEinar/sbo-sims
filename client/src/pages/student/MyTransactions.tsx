import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchStudentTransactions,
  StudentPortalFilters,
} from '@/api/student-portal';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useUserStore } from '@/store/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import StudentSemInput from '@/components/StudentSemInput';
import StudentSchoolYearInput from '@/components/StudentSchoolYearInput';
import PaginationController from '@/components/PaginationController';
import {
  Receipt,
  Filter,
  Calendar,
  Banknote,
  ArrowUpDown,
  Clock,
  Building,
  AlertCircle,
} from 'lucide-react';
import { numberWithCommas } from '@/lib/utils';
import Header from '@/components/ui/header';

export default function MyTransactions() {
  const { user } = useUserStore((state) => state);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Filters state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [modeOfPayment, setModeOfPayment] = useState<string>('all');

  const filters: StudentPortalFilters = {
    sortField,
    sortOrder,
    modeOfPayment: modeOfPayment !== 'all' ? modeOfPayment : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      'student-transactions',
      user?.activeSemDB,
      user?.activeSchoolYearDB,
      page,
      sortField,
      sortOrder,
      modeOfPayment,
    ],
    queryFn: () => fetchStudentTransactions(page, PAGE_SIZE, filters),
  });

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="animate-appear p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <Header>My Transactions</Header>
          <p className="text-muted-foreground mt-2 text-sm max-w-lg">
            Review all your payment records and transaction history across every
            enrolled organization.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            Showing data for{' '}
            <strong>
              SY {user?.activeSchoolYearDB} — Semester {user?.activeSemDB}
            </strong>
          </div>
        </div>

        {/* Term Selectors */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-[130px] md:w-[150px]">
            <StudentSemInput hideLabel />
          </div>
          <div className="w-full sm:w-[150px] md:w-[170px]">
            <StudentSchoolYearInput hideLabel />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4 bg-card/40 p-4 md:p-5 rounded-2xl border items-start lg:items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
          <Filter className="w-4 h-4" />
          <span className="font-bold tracking-wide uppercase text-xs">
            Filter & Sort
          </span>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
          <Select
            value={sortField === 'createdAt' ? sortOrder : undefined}
            onValueChange={(v: 'asc' | 'desc') => {
              setSortField('createdAt');
              setSortOrder(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Date" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="desc">Recent to Oldest</SelectItem>
              <SelectItem value="asc">Oldest to Recent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortField === 'amount' ? sortOrder : undefined}
            onValueChange={(v: 'asc' | 'desc') => {
              setSortField('amount');
              setSortOrder(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowUpDown className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Amount" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="desc">Highest to Lowest</SelectItem>
              <SelectItem value="asc">Lowest to Highest</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={setModeOfPayment}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Banknote className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Mode" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="gcash">GCash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary badge */}
      {!isLoading && total > 0 && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2">
          <span>Showing</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
            {rows.length}
          </span>
          <span>of</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
            {total}
          </span>
          <span>transactions</span>
        </div>
      )}

      {/* Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-2xl w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 px-6 text-muted-foreground bg-card/30 rounded-3xl border border-dashed border-muted-foreground/30 mt-6">
          <div className="bg-muted/50 p-5 rounded-full mb-5">
            <Receipt className="w-14 h-14 opacity-40 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2 tracking-tight">
            No transactions found
          </p>
          <p className="text-sm text-center max-w-sm leading-relaxed">
            You don't have any payment records for this specific term and filter
            criteria. Try adjusting your filters or switching terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {rows.map((tx) => (
            <Card
              key={tx._id}
              className="flex flex-col overflow-hidden rounded-2xl hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border-muted-foreground/15 group bg-card/50"
            >
              <div className="p-6 flex-1 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      <Building className="w-3.5 h-3.5 text-primary/70" />
                      <span className="truncate">
                        {tx.organization?.name ?? '—'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {tx.category?.name ?? '—'}
                    </h3>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-black text-4xl tracking-tighter text-foreground group-hover:text-primary transition-colors flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold opacity-50">₱</span>
                    {numberWithCommas(tx.amount)}
                  </span>
                </div>
              </div>

              <div className="bg-muted/40 px-6 py-4 flex items-center justify-between border-t border-muted-foreground/10 mt-auto group-hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  <span className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                    <span>{format(new Date(tx.createdAt), 'MMM d, yyyy')}</span>
                    <span className="hidden sm:inline opacity-50">•</span>
                    <span>{format(new Date(tx.createdAt), 'h:mm a')}</span>
                  </span>
                </div>

                <span
                  className={`text-[0.75rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${
                    tx.modeOfPayment === 'gcash'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}
                >
                  {tx.modeOfPayment}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6 flex justify-center">
          <PaginationController
            currentPage={page}
            prevPage={page > 1 ? page - 1 : -1}
            nextPage={page < totalPages ? page + 1 : -1}
            setPage={setPage}
          />
        </div>
      )}
    </div>
  );
}
