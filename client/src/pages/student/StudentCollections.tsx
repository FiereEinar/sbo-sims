import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchStudentCollections,
  StudentCollectionItem,
} from '@/api/student-portal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
import { FolderKanban } from 'lucide-react';
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

function StatusBadge({ status }: { status: StudentCollectionItem['status'] }) {
  const styles = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    partial:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function StudentCollections() {
  const { user } = useUserStore((state) => state);

  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');

  const { data: rawCollections = [], isLoading } = useQuery({
    queryKey: [
      'student-collections',
      user?.activeSemDB,
      user?.activeSchoolYearDB,
    ],
    queryFn: fetchStudentCollections,
  });

  // Unique orgs from loaded data for the org filter dropdown
  const uniqueOrgs = Array.from(
    new Map(
      rawCollections
        .filter((c) => c.organization)
        .map((c) => [c.organization._id, c.organization.name]),
    ).entries(),
  );

  // Client-side filtering & sorting (collections are not paginated — usually small)
  const collections = [...rawCollections]
    .filter((c) => statusFilter === 'all' || c.status === statusFilter)
    .filter((c) => orgFilter === 'all' || c.organization?._id === orgFilter)
    .sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortField === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === 'fee') {
        aVal = a.fee;
        bVal = b.fee;
      } else if (sortField === 'amountPaid') {
        aVal = a.amountPaid;
        bVal = b.amountPaid;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const total = rawCollections.length;

  const selectTriggerClass =
    'w-full border-none pl-0 focus:ring-0 shadow-none font-semibold text-muted-foreground bg-transparent';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            My Collections
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View fee categories and your payment status across your enrolled
            organizations.
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

      {/* Summary */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {collections.length}
          </span>{' '}
          of <span className="font-medium text-foreground">{total}</span>{' '}
          collection{total !== 1 ? 's' : ''} for{' '}
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
              {/* Category name sort */}
              <TableHead>
                <Select
                  value={sortField === 'name' ? sortOrder : undefined}
                  onValueChange={(v: 'asc' | 'desc') => {
                    setSortField('name');
                    setSortOrder(v);
                  }}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Collection Name" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Collection Name A → Z</SelectItem>
                    <SelectItem value="desc">Collection Name Z → A</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Organization filter */}
              <TableHead>
                <Select defaultValue="all" onValueChange={setOrgFilter}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {uniqueOrgs.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Fee sort */}
              <TableHead className="w-[130px]">
                <Select
                  value={sortField === 'fee' ? sortOrder : undefined}
                  onValueChange={(v: 'asc' | 'desc') => {
                    setSortField('fee');
                    setSortOrder(v);
                  }}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Fee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest to Lowest</SelectItem>
                    <SelectItem value="asc">Lowest to Highest</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Amount paid sort */}
              <TableHead className="w-[130px]">
                <Select
                  value={sortField === 'amountPaid' ? sortOrder : undefined}
                  onValueChange={(v: 'asc' | 'desc') => {
                    setSortField('amountPaid');
                    setSortOrder(v);
                  }}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Amount Paid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Highest to Lowest</SelectItem>
                    <SelectItem value="asc">Lowest to Highest</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>

              {/* Status filter */}
              <TableHead className="w-[130px]">
                <Select defaultValue="all" onValueChange={setStatusFilter}>
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton cols={5} />
            ) : collections.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-16 text-muted-foreground"
                >
                  <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-25" />
                  <p className="text-sm italic">
                    No collections found for this term.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              collections.map((col) => (
                <TableRow
                  key={col._id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium text-sm">
                    {col.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {col.organization?.name ?? '—'}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    ₱{numberWithCommas(col.fee)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {col.amountPaid > 0 ? (
                      `₱${numberWithCommas(col.amountPaid)}`
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={col.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
