import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentGpoa, StudentGpoaItem } from '@/api/student-portal';
import { useUserStore } from '@/store/user';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import StudentSemInput from '@/components/StudentSemInput';
import StudentSchoolYearInput from '@/components/StudentSchoolYearInput';

const STATUS_BADGE: Record<
  StudentGpoaItem['status'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  completed: 'default',
  cancelled: 'destructive',
  ongoing: 'secondary',
  upcoming: 'secondary',
};

export default function StudentGpoa() {
  const { user } = useUserStore((state) => state);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: gpoas = [], isLoading } = useQuery({
    queryKey: ['student-gpoa', user?.activeSemDB, user?.activeSchoolYearDB],
    queryFn: fetchStudentGpoa,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            General Plan of Action
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your organizations' planned activities for the current term.
          </p>
        </div>

        <div className="flex items-end gap-2 flex-wrap">
          <div className="w-[130px]">
            <StudentSemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <StudentSchoolYearInput hideLabel />
          </div>
        </div>
      </div>

      {/* Summary */}
      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">{gpoas.length}</span>{' '}
          plan{gpoas.length !== 1 ? 's' : ''} for{' '}
          <span className="font-medium text-foreground">
            SY {user?.activeSchoolYearDB} Sem {user?.activeSemDB}
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar View (Left) */}
        <div className="xl:col-span-8 flex flex-col rounded-lg border shadow-sm p-4 overflow-x-auto min-h-[500px]">
          <div className="flex items-center justify-between mb-4 min-w-[560px]">
            <h2 className="text-xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-l min-w-[560px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm py-2 border-b border-r bg-muted/30"
              >
                {day}
              </div>
            ))}

            {daysInMonth.map((day, idx) => {
              const dayPlans = gpoas.filter((p) =>
                isSameDay(new Date(p.targetDate), day),
              );

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border-b border-r p-1 ${
                    !isSameMonth(day, monthStart)
                      ? 'bg-muted/10 text-muted-foreground'
                      : 'bg-card'
                  }`}
                >
                  <div className="text-right text-xs font-medium p-1">
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {dayPlans.map((plan) => (
                      <div
                        key={plan._id}
                        className={`bg-primary/10 hover:bg-primary/20 text-[10px] px-1.5 py-1 rounded truncate font-medium border border-primary/20 ${
                          plan.status === 'cancelled'
                            ? 'text-red-500'
                            : plan.status === 'completed'
                              ? 'text-primary'
                              : 'text-foreground'
                        }`}
                        title={`${plan.name} · ${plan.organization?.name ?? ''}`}
                      >
                        {plan.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card View (Right) */}
        <div className="xl:col-span-4 flex flex-col xl:relative h-[500px] xl:h-auto">
          <div className="xl:absolute xl:inset-0 flex flex-col gap-4 h-full">
            <h3 className="text-lg font-semibold shrink-0">All Plans</h3>

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading plans…</p>
            ) : gpoas.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card/50 border-dashed">
                <ClipboardList className="w-10 h-10 mb-3 opacity-25" />
                <p className="text-sm text-muted-foreground italic">
                  No plans found for this term.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-10 flex-1">
                {gpoas.map((gpoa) => (
                  <Card key={gpoa._id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base leading-tight">
                          {gpoa.name}
                        </CardTitle>
                        <Badge
                          className="shrink-0"
                          variant={STATUS_BADGE[gpoa.status]}
                        >
                          {gpoa.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription>
                        {format(new Date(gpoa.targetDate), 'PPP')} &middot;{' '}
                        {gpoa.venue}
                        {gpoa.organization?.name && (
                          <>
                            {' '}
                            &middot;{' '}
                            <span className="text-primary font-medium">
                              {gpoa.organization.name}
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {gpoa.description && (
                        <p className="mb-2 text-sm text-foreground/80 line-clamp-2">
                          {gpoa.description}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-primary">
                        Budget: ₱{gpoa.budget.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
