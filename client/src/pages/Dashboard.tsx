import { fetchDashboardData, fetchTransactions } from '@/api/transaction';
import BarCharts from '@/components/BarChart';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import Header from '@/components/ui/header';
import { Skeleton } from '@/components/ui/skeleton';
import { QUERY_KEYS } from '@/constants';
import { numberWithCommas } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Transaction } from '@/types/transaction';
import { Category } from '@/types/category';
import SchoolYearInput from '@/components/SchoolYearInput';
import SemInput from '@/components/SemInput';
import StickyHeader from '@/components/StickyHeader';
import { TrendingUp, Users, CreditCard, BookOpen } from 'lucide-react';
import StatCard from '@/components/reports/StatCard';
import TransactionPieChart from '@/components/transaction/TransactionPieChart';

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

// ── Recent transactions ──────────────────────────────────────────────────────
type RecentTransactionsProps = {
  data?: Transaction[];
  isLoading: boolean;
};

function RecentTransactions({ data, isLoading }: RecentTransactionsProps) {
  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
      <h2 className="font-semibold mb-3">Recent Transactions</h2>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data?.length ? (
        <div className="divide-y">
          {data.map((t) => (
            <div key={t._id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">
                  {_.startCase(t.owner.firstname.toLowerCase())}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.owner.studentID}
                </p>
              </div>
              <p className="font-semibold">₱{numberWithCommas(t.amount)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No recent transactions
        </p>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_DATA],
    queryFn: fetchDashboardData,
  });

  const { data: txResult, isLoading: loadingTx } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTION],
    queryFn: () => fetchTransactions({}, 1, 5),
  });

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <Header>Dashboard Overview</Header>
        <div className="flex gap-4 items-center">
          <div className="w-[130px]">
            <SemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <SchoolYearInput hideLabel />
          </div>
        </div>
      </StickyHeader>

      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Collections"
            value={`₱${numberWithCommas(data?.totalRevenue ?? 0)}`}
            sub="This period"
            icon={<TrendingUp className="w-5 h-5" />}
            color="#6366f1"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Transactions"
            value={numberWithCommas(data?.totalTransaction ?? 0)}
            sub={`${data?.transactionsToday ?? 0} today`}
            icon={<CreditCard className="w-5 h-5" />}
            color="#10b981"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Students"
            value={numberWithCommas(data?.totalStudents ?? 0)}
            icon={<Users className="w-5 h-5" />}
            color="#f59e0b"
            isLoading={isLoading}
          />
          <StatCard
            title="Categories"
            value={numberWithCommas(data?.categories?.length ?? 0)}
            sub="Active this period"
            icon={<BookOpen className="w-5 h-5" />}
            color="#8b5cf6"
            isLoading={isLoading}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 rounded-2xl border bg-card/50 p-5 shadow-sm">
            <h2 className="font-semibold mb-3">Revenue Trend</h2>
            <BarCharts dashboardData={data} isLoading={isLoading} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Collections by category — original wheel */}
            <TransactionPieChart isLoading={isLoading} />
            <RecentTransactions data={txResult?.data} isLoading={loadingTx} />
          </div>
        </div>
      </div>
    </SidebarPageLayout>
  );
}
