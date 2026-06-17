import { Skeleton } from '@/components/ui/skeleton';

type StatCardProps = {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
  isLoading: boolean;
};

export default function StatCard({
  title,
  value,
  sub,
  icon,
  color = '#6366f1',
  isLoading,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-card/50 p-5 shadow-sm flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
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
