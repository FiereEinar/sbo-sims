import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchStudentCollections,
  StudentCollectionItem,
} from '@/api/student-portal';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  FolderKanban,
  Filter,
  Building,
  Banknote,
  ArrowUpDown,
  Type,
  Activity,
} from 'lucide-react';
import { numberWithCommas } from '@/lib/utils';
import Header from '@/components/ui/header';

function StatusBadge({ status }: { status: StudentCollectionItem['status'] }) {
  const styles = {
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    partial:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };
  return (
    <span
      className={`text-[0.7rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest ${styles[status]}`}
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

  return (
    <div className="animate-appear p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <Header>My Collections</Header>
          <p className="text-muted-foreground mt-2 text-sm max-w-lg">
            View fee categories and your payment status across your enrolled
            organizations.
          </p>
        </div>

        {/* Term Selectors (Naked) */}
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
      <div className="flex flex-col 2xl:flex-row gap-4 bg-card/40 p-4 md:p-5 rounded-2xl border items-start 2xl:items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
          <Filter className="w-4 h-4" />
          <span className="font-bold tracking-wide uppercase text-xs">
            Filter & Sort
          </span>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full 2xl:w-auto">
          {/* Organization Filter */}
          <Select defaultValue="all" onValueChange={setOrgFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium truncate">
                <Building className="w-4 h-4 shrink-0 text-primary/70" />
                <span className="truncate">
                  {orgFilter === 'all'
                    ? 'All Organizations'
                    : uniqueOrgs.find((o) => o[0] === orgFilter)?.[1] || 'Org'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Organizations</SelectItem>
              {uniqueOrgs.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select defaultValue="all" onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort: Name */}
          <Select
            value={sortField === 'name' ? sortOrder : undefined}
            onValueChange={(v: 'asc' | 'desc') => {
              setSortField('name');
              setSortOrder(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Type className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Name" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="asc">Name (A → Z)</SelectItem>
              <SelectItem value="desc">Name (Z → A)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort: Fee */}
          <Select
            value={sortField === 'fee' ? sortOrder : undefined}
            onValueChange={(v: 'asc' | 'desc') => {
              setSortField('fee');
              setSortOrder(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Banknote className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Fee" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="desc">Fee (Highest)</SelectItem>
              <SelectItem value="asc">Fee (Lowest)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort: Amount Paid */}
          <Select
            value={sortField === 'amountPaid' ? sortOrder : undefined}
            onValueChange={(v: 'asc' | 'desc') => {
              setSortField('amountPaid');
              setSortOrder(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-background border-muted-foreground/20 rounded-xl h-11 focus:ring-primary/20 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowUpDown className="w-4 h-4 text-primary/70" />
                <SelectValue placeholder="Paid" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="desc">Paid (Highest)</SelectItem>
              <SelectItem value="asc">Paid (Lowest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary badge */}
      {!isLoading && total > 0 && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2">
          <span>Showing</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
            {collections.length}
          </span>
          <span>of</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
            {total}
          </span>
          <span>collections</span>
        </div>
      )}

      {/* Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-2xl w-full" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 px-6 text-muted-foreground bg-card/30 rounded-3xl border border-dashed border-muted-foreground/30 mt-6">
          <div className="bg-muted/50 p-5 rounded-full mb-5">
            <FolderKanban className="w-14 h-14 opacity-40 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2 tracking-tight">
            No collections found
          </p>
          <p className="text-sm text-center max-w-sm leading-relaxed">
            You don't have any collections for this term, or they are filtered
            out.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Card
              key={col._id}
              className="flex flex-col overflow-hidden rounded-2xl hover:-translate-y-1.5 transition-all duration-300 border-muted-foreground/15 group bg-card/40"
            >
              <div className="p-6 flex-1 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      <Building className="w-3.5 h-3.5 text-primary/70" />
                      <span className="truncate">
                        {col.organization?.name ?? '—'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {col.name}
                    </h3>
                  </div>
                  <div className="shrink-0 mt-1">
                    <StatusBadge status={col.status} />
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 px-6 py-4 flex items-center justify-between border-t border-muted-foreground/10 mt-auto group-hover:bg-primary/5 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[0.7rem] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Fee
                  </span>
                  <span className="font-extrabold text-lg tracking-tight text-foreground">
                    <span className="text-sm opacity-50 mr-0.5">₱</span>
                    {numberWithCommas(col.fee)}
                  </span>
                </div>
                <div className="w-[1px] h-10 bg-muted-foreground/10" />
                <div className="flex flex-col items-end">
                  <span className="text-[0.7rem] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                    Amount Paid
                  </span>
                  <span className="font-extrabold text-lg tracking-tight text-primary">
                    {col.amountPaid > 0 ? (
                      <>
                        <span className="text-sm opacity-60 mr-0.5">₱</span>
                        {numberWithCommas(col.amountPaid)}
                      </>
                    ) : (
                      <span className="text-muted-foreground opacity-50">
                        —
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
