import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  fetchReportSummary,
  fetchMonthlyReport,
  CategoryBreakdown,
  TopStudent,
} from '@/api/report';
import { Skeleton } from '@/components/ui/skeleton';
import { numberWithCommas } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  BookOpen,
  CreditCard,
  Award,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@/components/reports/StatCard';
import ModeOfPaymentChart from '@/components/reports/ModeOfPaymentChart';

const QUERY_KEY_SUMMARY = 'report_summary';
const QUERY_KEY_MONTHLY = 'report_monthly';

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm mt-6">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-primary rounded-full" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function CategoryTable({ data, isLoading }: { data?: CategoryBreakdown[]; isLoading: boolean; }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-8">
        No categories found for this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
            <th className="text-left py-2 pr-4 font-medium">Category</th>
            <th className="text-right py-2 px-4 font-medium">Fee</th>
            <th className="text-right py-2 px-4 font-medium">Collected</th>
            <th className="text-right py-2 px-4 font-medium">Expected</th>
            <th className="text-right py-2 px-4 font-medium">Txns</th>
            <th className="text-right py-2 pl-4 font-medium">Collection Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((cat) => {
            const rate = cat.collectionRate;
            const rateColor =
              rate >= 80 ? 'text-emerald-500' : rate >= 50 ? 'text-amber-500' : 'text-rose-500';
            const bgColor =
              rate >= 80 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <tr key={cat.name} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-4 font-medium">{cat.name}</td>
                <td className="py-3 px-4 text-right text-muted-foreground">
                  ₱{numberWithCommas(cat.fee)}
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  ₱{numberWithCommas(cat.totalCollected)}
                </td>
                <td className="py-3 px-4 text-right text-muted-foreground">
                  ₱{numberWithCommas(cat.expectedRevenue)}
                </td>
                <td className="py-3 px-4 text-right">{cat.totalTransactions}</td>
                <td className="py-3 pl-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${bgColor}`}
                        style={{ width: `${Math.min(100, rate)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${rateColor}`}>
                      {rate}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopStudentsTable({ data, isLoading }: { data?: TopStudent[]; isLoading: boolean; }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-8">
        No transaction data available.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
            <th className="text-left py-2 pr-4 font-medium w-8">#</th>
            <th className="text-left py-2 pr-4 font-medium">Student</th>
            <th className="text-left py-2 px-4 font-medium">Course</th>
            <th className="text-right py-2 px-4 font-medium">Transactions</th>
            <th className="text-right py-2 pl-4 font-medium">Total Paid</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((s, idx) => (
            <tr key={s.studentID} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
              <td className="py-3 pr-4">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.studentID}</p>
              </td>
              <td className="py-3 px-4 text-muted-foreground">{s.course}</td>
              <td className="py-3 px-4 text-right">{s.txCount}</td>
              <td className="py-3 pl-4 text-right font-semibold text-emerald-500">
                ₱{numberWithCommas(s.totalPaid)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinancialReportsView() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: [QUERY_KEY_SUMMARY],
    queryFn: fetchReportSummary,
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: [QUERY_KEY_MONTHLY],
    queryFn: fetchMonthlyReport,
  });

  return (
    <div className="w-full animate-in fade-in duration-300">
      {summary && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 mb-4 w-fit">
          <AlertCircle className="w-3.5 h-3.5" />
          Showing data for{' '}
          <strong>
            SY {summary.meta.schoolYear} — Semester {summary.meta.semester}
          </strong>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collections"
          value={`₱${numberWithCommas(summary?.totalRevenue ?? 0)}`}
          sub="This period"
          icon={<TrendingUp className="w-5 h-5" />}
          color="#6366f1"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Transactions"
          value={numberWithCommas(summary?.totalTransactions ?? 0)}
          icon={<CreditCard className="w-5 h-5" />}
          color="#10b981"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Students"
          value={numberWithCommas(summary?.totalStudents ?? 0)}
          icon={<Users className="w-5 h-5" />}
          color="#f59e0b"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Categories"
          value={numberWithCommas(summary?.categoryBreakdown.length ?? 0)}
          sub="Active this period"
          icon={<BookOpen className="w-5 h-5" />}
          color="#8b5cf6"
          isLoading={summaryLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2">
          <ReportSection title="Monthly Collections (Last 12 Months)">
            {monthlyLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : monthly?.some((m) => m.totalAmount > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={(v) => v.slice(0, 3)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={(v) => `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`₱${numberWithCommas(val)}`, 'Collections']}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="totalAmount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm italic">
                No transaction data in the last 12 months.
              </div>
            )}
          </ReportSection>
        </div>

        <div className="mt-6">
          <ModeOfPaymentChart
            data={summary?.modeOfPayment}
            isLoading={summaryLoading}
            chartHeight={200}
          />
        </div>
      </div>

      <ReportSection title="Category Performance & Collection Rate">
        <CategoryTable data={summary?.categoryBreakdown} isLoading={summaryLoading} />
      </ReportSection>

      <ReportSection title="Monthly Collections (Current Period)">
        {summaryLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : summary?.monthly && summary.monthly.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-medium">Month</th>
                  <th className="text-right py-2 px-4 font-medium">Transactions</th>
                  <th className="text-right py-2 pl-4 font-medium">Amount Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {summary.monthly.map((m) => (
                  <tr key={m.month} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-medium">{m.month}</td>
                    <td className="py-3 px-4 text-right">{m.count}</td>
                    <td className="py-3 pl-4 text-right font-semibold">
                      ₱{numberWithCommas(m.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border">
                  <td className="py-3 pr-4 font-bold text-xs uppercase text-muted-foreground">Total</td>
                  <td className="py-3 px-4 text-right font-bold">
                    {summary.monthly.reduce((a, m) => a + m.count, 0)}
                  </td>
                  <td className="py-3 pl-4 text-right font-bold text-primary">
                    ₱{numberWithCommas(summary.totalRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            No monthly data available for this period.
          </p>
        )}
      </ReportSection>

      <ReportSection title="Top 10 Paying Students">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Students with the highest total payment amount this period
          </p>
        </div>
        <TopStudentsTable data={summary?.topStudents} isLoading={summaryLoading} />
      </ReportSection>
    </div>
  );
}
