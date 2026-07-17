import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentTransactions, StudentPortalFilters } from '@/api/student-portal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

import StudentSemInput from '@/components/StudentSemInput';
import StudentSchoolYearInput from '@/components/StudentSchoolYearInput';
import PaginationController from '@/components/PaginationController';
import { Receipt } from 'lucide-react';
import { numberWithCommas } from '@/lib/utils';

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            My Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your payment records across every enrolled organization.
          </p>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <div className="w-[130px]">
            <StudentSemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <StudentSchoolYearInput hideLabel />
          </div>
        </div>
      </div>

      {/* Summary badge */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">{rows.length}</span> of{' '}
          <span className="font-medium text-foreground">{total}</span>{' '}
          transaction{total !== 1 ? 's' : ''} for{' '}
          <span className="font-medium text-foreground">
            SY {user?.activeSchoolYearDB} Sem {user?.activeSemDB}
          </span>
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/40">
              <TableHead className="w-[160px]">
                <Select
                  value={sortField === 'createdAt' ? sortOrder : undefined}
                  onValueChange={(v: 'asc' | 'desc') => {
                    setSortField('createdAt');
                    setSortOrder(v);
                  }}
                >
                  <SelectTrigger className="w-full border-none pl-0 focus:ring-0 shadow-none font-semibold text-muted-foreground bg-transparent">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Recent to Oldest</SelectItem>
                    <SelectItem value="asc">Oldest to Recent</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[160px]">
                <Select
                  value={sortField === 'amount' ? sortOrder : undefined}
                  onValueChange={(v: 'asc' | 'desc') => {
                    setSortField('amount');
                    setSortOrder(v);
                  }}
                >
                  <SelectTrigger className="w-full border-none pl-0 focus:ring-0 shadow-none font-semibold text-muted-foreground bg-transparent">
                    <SelectValue placeholder="Amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest to Lowest</SelectItem>
                    <SelectItem value="asc">Lowest to Highest</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className="w-[130px]">
                <Select defaultValue="all" onValueChange={setModeOfPayment}>
                  <SelectTrigger className="w-full border-none pl-0 focus:ring-0 shadow-none font-semibold text-muted-foreground bg-transparent">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-16 text-muted-foreground"
                >
                  <Receipt className="w-10 h-10 mx-auto mb-3 opacity-25" />
                  <p className="text-sm italic">
                    No transactions found for this term.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((tx) => (
                <TableRow
                  key={tx._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                    <br />
                    <span className="text-[0.7rem]">
                      {format(new Date(tx.createdAt), 'h:mm a')}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {tx.organization?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tx.category?.name ?? '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    ₱{numberWithCommas(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        tx.modeOfPayment === 'gcash'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      }`}
                    >
                      {tx.modeOfPayment}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationController
          currentPage={page}
          prevPage={page > 1 ? page - 1 : -1}
          nextPage={page < totalPages ? page + 1 : -1}
          setPage={setPage}
        />
      )}
    </div>
  );
}
