import { useQuery } from '@tanstack/react-query';
import { fetchStudentDashboard } from '@/api/student-portal';
import StatCard from '@/components/reports/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { numberWithCommas } from '@/lib/utils';
import { useUserStore } from '@/store/user';
import {
  CreditCard,
  CalendarCheck,
  Building2,
  Wallet,
  Clock,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import _ from 'lodash';

const QUERY_KEY = 'student-dashboard';

function RecentTransactionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function RecentAttendanceSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useUserStore((state) => state);
  const QUERY_KEY = ['student-dashboard', user?.activeSemDB, user?.activeSchoolYearDB];

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchStudentDashboard,
  });

  console.log(data);

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {_.startCase((user?.firstname ?? '').toLowerCase())}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's a summary of your records across all organizations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Fees Paid"
          value={`₱${numberWithCommas(data?.totalPaid ?? 0)}`}
          sub="Across all orgs"
          icon={<Wallet className="w-5 h-5" />}
          color="#6366f1"
          isLoading={isLoading}
        />
        <StatCard
          title="Transactions"
          value={numberWithCommas(data?.totalTransactions ?? 0)}
          sub="Total records"
          icon={<CreditCard className="w-5 h-5" />}
          color="#10b981"
          isLoading={isLoading}
        />
        <StatCard
          title="Events Attended"
          value={numberWithCommas(data?.totalAttended ?? 0)}
          sub="All-time sessions"
          icon={<CalendarCheck className="w-5 h-5" />}
          color="#f59e0b"
          isLoading={isLoading}
        />
        <StatCard
          title="Organizations"
          value={numberWithCommas(data?.activeOrgs ?? 0)}
          sub="Enrolled in"
          icon={<Building2 className="w-5 h-5" />}
          color="#8b5cf6"
          isLoading={isLoading}
        />
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Recent Transactions
          </h2>
          {isLoading ? (
            <RecentTransactionsSkeleton />
          ) : data?.recentTransactions.length ? (
            <div className="divide-y">
              {data.recentTransactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between py-3 gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.category?.name ?? 'Fee'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {tx.organization?.name ?? '—'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • SY {tx.schoolYear} Sem {tx.semester}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">
                      ₱{numberWithCommas(tx.amount)}
                    </p>
                    <span className="text-xs text-muted-foreground capitalize">
                      {tx.modeOfPayment}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-6">
              No transaction records found.
            </p>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="rounded-2xl border bg-card/50 p-5 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary" />
            Recent Attendance
          </h2>
          {isLoading ? (
            <RecentAttendanceSkeleton />
          ) : data?.recentAttendance.length ? (
            <div className="divide-y">
              {data.recentAttendance.map((att) => (
                <div
                  key={att._id}
                  className="flex items-center justify-between py-3 gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {att.event?.name ?? 'Event'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {att.session?.name ?? 'Session'}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {att.organization?.name ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    {format(new Date(att.recordedAt), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-6">
              No attendance records found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
