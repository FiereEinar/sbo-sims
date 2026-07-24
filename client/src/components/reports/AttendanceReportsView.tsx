import { useQuery } from '@tanstack/react-query';
import { fetchAttendanceReportSummary } from '@/api/attendance-report';
import { Skeleton } from '@/components/ui/skeleton';
import { numberWithCommas } from '@/lib/utils';
import { CalendarDays, ScanLine, Users, AlertCircle, Award } from 'lucide-react';
import StatCard from '@/components/reports/StatCard';
import { QUERY_KEYS } from '@/constants';
import { format } from 'date-fns';

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

export default function AttendanceReportsView() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_REPORT_SUMMARY],
    queryFn: fetchAttendanceReportSummary,
  });

  return (
    <div className="w-full animate-in fade-in duration-300">
      {summary && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 mb-4 w-fit">
          <AlertCircle className="w-3.5 h-3.5" />
          Showing attendance data for{' '}
          <strong>
            SY {summary.meta.schoolYear} — Semester {summary.meta.semester}
          </strong>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Events"
          value={numberWithCommas(summary?.totalEvents ?? 0)}
          icon={<CalendarDays className="w-5 h-5" />}
          color="#6366f1"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Sessions"
          value={numberWithCommas(summary?.totalSessions ?? 0)}
          icon={<Users className="w-5 h-5" />}
          color="#8b5cf6"
          isLoading={summaryLoading}
        />
        <StatCard
          title="Total Attendances Scanned"
          value={numberWithCommas(summary?.totalAttendances ?? 0)}
          icon={<ScanLine className="w-5 h-5" />}
          color="#10b981"
          isLoading={summaryLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <ReportSection title="Attendance by Event">
          {summaryLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : summary?.eventsBreakdown && summary.eventsBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-4 font-medium">Event</th>
                    <th className="text-left py-2 px-4 font-medium">Date</th>
                    <th className="text-right py-2 px-4 font-medium">Sessions</th>
                    <th className="text-right py-2 pl-4 font-medium">Scans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {summary.eventsBreakdown.map((ev) => (
                    <tr key={ev.eventId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">{ev.title}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {format(new Date(ev.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right">{ev.totalSessions}</td>
                      <td className="py-3 pl-4 text-right font-semibold text-emerald-500">
                        {numberWithCommas(ev.totalScans)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              No events found for this period.
            </p>
          )}
        </ReportSection>

        <ReportSection title="Top Attending Students">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Students with the highest attendance count this period
            </p>
          </div>
          {summaryLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : summary?.topStudents && summary.topStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                    <th className="text-left py-2 pr-4 font-medium w-8">#</th>
                    <th className="text-left py-2 pr-4 font-medium">Student</th>
                    <th className="text-left py-2 px-4 font-medium">Course</th>
                    <th className="text-right py-2 pl-4 font-medium">Attended Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {summary.topStudents.map((s, idx) => (
                    <tr key={s.studentID} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.studentID}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{s.course}</td>
                      <td className="py-3 pl-4 text-right font-semibold text-emerald-500">
                        {numberWithCommas(s.attendedCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              No attendance data available.
            </p>
          )}
        </ReportSection>
      </div>
    </div>
  );
}
