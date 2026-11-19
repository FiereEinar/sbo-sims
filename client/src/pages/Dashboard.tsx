import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
import BarCharts from '@/components/BarChart';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import Header from '@/components/ui/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QUERY_KEYS } from '@/constants';
import { numberWithCommas } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Transaction } from '@/types/transaction';
import { Category } from '@/types/category';
import SchoolYearInput from '@/components/SchoolYearInput';
import SemInput from '@/components/SemInput';
import StickyHeader from '@/components/StickyHeader';
import { useTenantNavigate } from '@/hooks/useTenantNavigate';
import {
  TrendingUp,
  Users,
  Plus,
  ScanLine,
  ArrowUpRight,
  Receipt,
  Tag,
  FileText,
  Wallet,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';

export type DashboardDataTransaction = {
  date: Date;
  totalAmount: number;
};

export type DashboardDataCategory = {
  category: Category;
  totalAmount: number;
  totalTransactions: number;
};

export type DashboardData = {
  totalRevenue: number;
  totalRevenueLastMonth: number;
  totalStudents: number;
  transactionsToday: number;
  totalTransaction: number;
  totalTransactionLastMonth: number;
  transactions: DashboardDataTransaction[];
  categories: DashboardDataCategory[];
};

// ── Recent transactions stream ──────────────────────────────────────────────
type RecentTransactionsProps = {
  data?: Transaction[];
  isLoading: boolean;
  totalTransactions?: number;
};

function RecentTransactions({
  data,
  isLoading,
  totalTransactions = 0,
}: RecentTransactionsProps) {
  const navigate = useTenantNavigate();

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-base tracking-tight text-foreground">
            Recent Transactions
          </h3>
          <p className="text-xs text-muted-foreground">
            Latest incoming receipts and payments
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('transaction')}
          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground group"
        >
          View all ({numberWithCommas(totalTransactions)})
          <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </div>

      <div className="flex-1 divide-y divide-border/30 overflow-y-auto mt-2">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.length ? (
          data.map((t) => {
            const fullName =
              `${_.startCase(t.owner?.firstname?.toLowerCase() || '')} ${_.startCase(t.owner?.lastname?.toLowerCase() || '')}`.trim();
            const isCash = t.modeOfPayment === 'cash';

            return (
              <div
                key={t._id}
                onClick={() => navigate(`transactions/${t._id}`)}
                className="flex items-center justify-between py-3 px-1.5 -mx-1.5 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    {t.owner?.firstname
                      ? t.owner.firstname[0].toUpperCase()
                      : 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {fullName || 'Student'}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                      <span className="tabular-nums">{t.owner?.studentID}</span>
                      {t.category?.name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{t.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    ₱{numberWithCommas(t.amount)}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full border ${
                        isCash
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {isCash ? 'Cash' : 'GCash'}
                    </span>
                    {t.createdAt && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {format(new Date(t.createdAt), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Receipt className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">No transactions logged yet</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Transactions recorded in this term will stream here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Category Progress Breakdown ─────────────────────────────────────────────
type CategoryBreakdownProps = {
  categories?: DashboardDataCategory[];
  totalRevenue: number;
  isLoading: boolean;
};

function CategoryBreakdown({
  categories = [],
  totalRevenue,
  isLoading,
}: CategoryBreakdownProps) {
  const navigate = useTenantNavigate();

  // Sort categories by highest revenue share
  const sorted = [...categories].sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-base tracking-tight text-foreground">
            Category Allocation
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribution across active fee categories
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('category')}
          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground group"
        >
          Manage funds
          <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 pt-3 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : sorted.length ? (
          sorted.map((item) => {
            const cat = item.category;
            const percentage =
              totalRevenue > 0
                ? Math.round((item.totalAmount / totalRevenue) * 100)
                : 0;

            return (
              <div
                key={cat?._id || item.totalAmount}
                onClick={() => cat?._id && navigate(`categories/${cat._id}`)}
                className="space-y-1.5 p-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {cat?.name || 'Unnamed Category'}
                    </span>
                    {cat?.fee !== undefined && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5 font-normal tracking-wide tabular-nums"
                      >
                        ₱{numberWithCommas(cat.fee)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold tabular-nums text-foreground">
                      ₱{numberWithCommas(item.totalAmount)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1.5 tabular-nums">
                      ({percentage}%)
                    </span>
                  </div>
                </div>

                <Progress value={percentage} className="h-2" />

                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>
                    Target fee:{' '}
                    <span className="tabular-nums font-medium text-foreground/80">
                      ₱{numberWithCommas(cat?.fee ?? 0)}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {numberWithCommas(item.totalTransactions)} paid
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Tag className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">No categories recorded</p>
            <p className="text-xs text-muted-foreground/80 mt-0.5">
              Create fee categories to start collecting funds.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('categories')}
              className="mt-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Category
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useTenantNavigate();

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_DATA],
    queryFn: fetchDashboardData,
  });

  const { data: txResult, isLoading: loadingTx } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTION, 'recent'],
    queryFn: () => fetchTransactions({}, 1, 8),
  });

  const averageTicket =
    data?.totalRevenue && data?.totalTransaction
      ? Math.round(data.totalRevenue / data.totalTransaction)
      : 0;

  return (
    <SidebarPageLayout>
      {/* Sticky Academic Term & Session Header */}
      <StickyHeader>
        <div className="space-y-0.5">
          <Header>Dashboard Overview</Header>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Academic Term Scoped</span>
            <span>•</span>
            <span className="tabular-nums">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
        </div>

        <div id="term-selector" className="flex gap-3 items-center">
          <div className="w-[130px]">
            <SemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <SchoolYearInput hideLabel />
          </div>
        </div>
      </StickyHeader>

      <div className="space-y-6 pt-1">
        {/* Booth Fast-Action Launcher */}
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-border/40 bg-card/40 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1 mr-1">
            Quick Actions:
          </span>
          <Button
            size="sm"
            onClick={() => navigate('transaction')}
            className="h-8 text-xs font-medium shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Payment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('events')}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Event Scanner
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('student')}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Student Masterlist
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('category')}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            Fee Categories
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('reports')}
            className="h-8 text-xs font-medium gap-1.5 hidden md:inline-flex"
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Reports
          </Button>
        </div>

        {/* Asymmetric Velocity Strip (Refusing 4 cookie-cutter cards) */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Primary Collections Box (Dominant Span 2) */}
          <div className="md:col-span-2 rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Term Collections
                </p>
                {isLoading ? (
                  <Skeleton className="h-9 w-44" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      ₱{numberWithCommas(data?.totalRevenue ?? 0)}
                    </p>
                    <span className="text-xs text-muted-foreground font-medium">
                      net intake
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-xl p-2.5 bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>
                  Prior period:{' '}
                  <strong className="font-semibold tabular-nums text-foreground/90">
                    ₱{numberWithCommas(data?.totalRevenueLastMonth ?? 0)}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>
                  <strong className="font-semibold tabular-nums text-foreground/90">
                    {numberWithCommas(data?.totalTransaction ?? 0)}
                  </strong>{' '}
                  receipts issued
                </span>
              </div>
            </div>
          </div>

          {/* Today's Booth Velocity Box */}
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Today's Velocity
                </p>
                {isLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {data?.transactionsToday ?? 0}
                    </p>
                    <span className="text-xs text-muted-foreground font-medium">
                      receipts
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-xl p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-border/30 flex items-center justify-between text-xs">
              {(data?.transactionsToday ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Active booth shift
                </span>
              ) : (
                <span className="text-muted-foreground">
                  No transactions today
                </span>
              )}
              <span className="text-muted-foreground tabular-nums">
                {format(new Date(), 'MMM d')}
              </span>
            </div>
          </div>

          {/* Enrolled Roster & Fund Coverage Box */}
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Enrolled Students
                </p>
                {isLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                      {numberWithCommas(data?.totalStudents ?? 0)}
                    </p>
                    <span className="text-xs text-muted-foreground font-medium">
                      students
                    </span>
                  </div>
                )}
              </div>
              <div className="rounded-xl p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <strong className="font-semibold tabular-nums text-foreground/90">
                  {data?.categories?.length ?? 0}
                </strong>{' '}
                active funds
              </span>
              {averageTicket > 0 && (
                <span>
                  ~
                  <strong className="font-semibold tabular-nums text-foreground/90">
                    ₱{numberWithCommas(averageTicket)}
                  </strong>
                  /tx
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Daily Collection Velocity & Timeline */}
        <BarCharts dashboardData={data} isLoading={isLoading} />

        {/* Dual-Pane Operations Deck: Category Progress vs Recent Transactions Stream */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <CategoryBreakdown
            categories={data?.categories}
            totalRevenue={data?.totalRevenue ?? 0}
            isLoading={isLoading}
          />
          <RecentTransactions
            data={txResult?.data}
            isLoading={loadingTx}
            totalTransactions={data?.totalTransaction}
          />
        </div>
      </div>
    </SidebarPageLayout>
  );
}
