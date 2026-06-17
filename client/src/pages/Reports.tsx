import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  fetchReportSummary,
  fetchMonthlyReport,
  CategoryBreakdown,
  TopStudent,
} from '@/api/report';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import SchoolYearInput from '@/components/SchoolYearInput';
import SemInput from '@/components/SemInput';
import { Skeleton } from '@/components/ui/skeleton';
import { numberWithCommas } from '@/lib/utils';
import {
  FileDown,
  TrendingUp,
  Users,
  BookOpen,
  CreditCard,
  Award,
  AlertCircle,
} from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/user';

const QUERY_KEY_SUMMARY = 'report_summary';
const QUERY_KEY_MONTHLY = 'report_monthly';

const PIE_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon,
  color = '#6366f1',
  isLoading,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <>
            <p className="text-2xl font-semibold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </div>
      <div
        className="rounded-xl p-3"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-primary rounded-full" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Category performance table ──────────────────────────────────────────────
function CategoryTable({
  data,
  isLoading,
}: {
  data?: CategoryBreakdown[];
  isLoading: boolean;
}) {
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
            <th className="text-right py-2 pl-4 font-medium">
              Collection Rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((cat) => {
            const rate = cat.collectionRate;
            const rateColor =
              rate >= 80
                ? 'text-emerald-500'
                : rate >= 50
                  ? 'text-amber-500'
                  : 'text-rose-500';
            const bgColor =
              rate >= 80
                ? 'bg-emerald-500'
                : rate >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

            return (
              <tr
                key={cat.name}
                className="hover:bg-muted/30 transition-colors"
              >
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
                <td className="py-3 px-4 text-right">
                  {cat.totalTransactions}
                </td>
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

// ── Top students table ──────────────────────────────────────────────────────
function TopStudentsTable({
  data,
  isLoading,
}: {
  data?: TopStudent[];
  isLoading: boolean;
}) {
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
            <tr
              key={s.studentID}
              className="hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">
                {idx + 1}
              </td>
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

// ── Download PDF button ─────────────────────────────────────────────────────
function DownloadPDFButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUserStore();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/report/download/pdf', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_SY${user?.activeSchoolYearDB}_SEM${user?.activeSemDB}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err.message ?? 'Failed to download the PDF report.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="downloadReportPDF"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      <FileDown className="w-4 h-4" />
      {loading ? 'Generating…' : 'Download PDF'}
    </button>
  );
}

// ── Main Reports page ───────────────────────────────────────────────────────
export default function Reports() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: [QUERY_KEY_SUMMARY],
    queryFn: fetchReportSummary,
  });

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: [QUERY_KEY_MONTHLY],
    queryFn: fetchMonthlyReport,
  });

  const mopTotal = summary?.modeOfPayment.reduce((s, m) => s + m.total, 0) ?? 0;

  return (
    <SidebarPageLayout>
      {/* Header */}
      <StickyHeader>
        <Header>Reports</Header>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-[130px]">
            <SemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <SchoolYearInput hideLabel />
          </div>
          <DownloadPDFButton />
        </div>
      </StickyHeader>

      {/* Period indicator */}
      {summary && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 w-fit">
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

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly bar chart — uses rolling 12-month data */}
        <div className="lg:col-span-2">
          <ReportSection title="Monthly Collections (Last 12 Months)">
            {monthlyLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : monthly?.some((m) => m.totalAmount > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={monthly}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={(v) => v.slice(0, 3)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={(v) =>
                      `₱${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <Tooltip
                    formatter={(val: number) => [
                      `₱${numberWithCommas(val)}`,
                      'Collections',
                    ]}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="totalAmount"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm italic">
                No transaction data in the last 12 months.
              </div>
            )}
          </ReportSection>
        </div>

        {/* Mode of payment pie */}
        <ReportSection title="Mode of Payment">
          {summaryLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : summary?.modeOfPayment && mopTotal > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={summary.modeOfPayment}
                    dataKey="total"
                    nameKey="mode"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {summary.modeOfPayment.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`₱${numberWithCommas(val)}`]}
                    contentStyle={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    formatter={(val?: string) =>
                      val ? val.charAt(0).toUpperCase() + val.slice(1) : ''
                    }
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {summary.modeOfPayment.map((m, i) => (
                  <div key={m.mode} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground capitalize">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                      {m.mode}
                    </span>
                    <span className="font-medium">
                      ₱{numberWithCommas(m.total)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({((m.total / mopTotal) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm italic">
              No payment data for this period.
            </div>
          )}
        </ReportSection>
      </div>

      {/* Category performance */}
      <ReportSection title="Category Performance & Collection Rate">
        <CategoryTable
          data={summary?.categoryBreakdown}
          isLoading={summaryLoading}
        />
      </ReportSection>

      {/* Monthly summary table (from current sem/year) */}
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
                  <th className="text-right py-2 px-4 font-medium">
                    Transactions
                  </th>
                  <th className="text-right py-2 pl-4 font-medium">
                    Amount Collected
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {summary.monthly.map((m) => (
                  <tr
                    key={m.month}
                    className="hover:bg-muted/30 transition-colors"
                  >
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
                  <td className="py-3 pr-4 font-bold text-xs uppercase text-muted-foreground">
                    Total
                  </td>
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

      {/* Top paying students */}
      <ReportSection title="Top 10 Paying Students">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Students with the highest total payment amount this period
          </p>
        </div>
        <TopStudentsTable
          data={summary?.topStudents}
          isLoading={summaryLoading}
        />
      </ReportSection>
    </SidebarPageLayout>
  );
}
