import { DashboardDataCategory } from '@/pages/Dashboard';
import { numberWithCommas } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  // Legend,
  ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

type CollectionsByCategoryChartProps = {
  data?: DashboardDataCategory[];
  totalRevenue?: number;
  isLoading: boolean;
  /** Height of the pie chart canvas. Defaults to 180. */
  chartHeight?: number;
};

export default function CollectionsByCategoryChart({
  data,
  totalRevenue = 0,
  isLoading,
  chartHeight = 180,
}: CollectionsByCategoryChartProps) {
  const hasData = data && data.some((d) => d.totalAmount > 0);

  // Flatten to recharts-friendly shape
  const chartData = (data ?? []).map((d) => ({
    name: d.category.name,
    value: d.totalAmount,
  }));

  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
      <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-4 bg-primary rounded-full" />
        Collections by Category
      </h2>
      {isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : hasData ? (
        <>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={72}
                paddingAngle={3}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [`₱${numberWithCommas(val)}`]}
                contentStyle={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--primary-foreground)',
                }}
                cursor={{
                  stroke: 'var(--border)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              {/* <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: 11 }}
              /> */}
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground truncate max-w-[60%]">
                  <span
                    className="inline-block w-2 h-2 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {d.name}
                </span>
                <span className="font-medium">
                  ₱{numberWithCommas(d.value)}
                  {totalRevenue > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({((d.value / totalRevenue) * 100).toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-56 flex items-center justify-center text-muted-foreground text-sm italic">
          No category data for this period.
        </div>
      )}
    </div>
  );
}
