import { MopBreakdown } from '@/api/report';
import { numberWithCommas } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type ModeOfPaymentChartProps = {
  data?: MopBreakdown[];
  isLoading: boolean;
  /** Height of the pie chart canvas. Defaults to 180. */
  chartHeight?: number;
};

export default function ModeOfPaymentChart({
  data,
  isLoading,
  chartHeight = 180,
}: ModeOfPaymentChartProps) {
  const mopTotal = data?.reduce((s, m) => s + m.total, 0) ?? 0;

  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-primary rounded-full" />
        Mode of Payment
      </h2>
      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : data && mopTotal > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="mode"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={72}
                paddingAngle={3}
              >
                {data.map((_, i) => (
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
            {data.map((m, i) => (
              <div key={m.mode} className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground capitalize">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
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
        <div className="h-56 flex items-center justify-center text-muted-foreground text-sm italic">
          No payment data for this period.
        </div>
      )}
    </div>
  );
}
