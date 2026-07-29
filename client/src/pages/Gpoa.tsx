import { useState } from 'react';
import { gpoaService } from '@/services/gpoa.service';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import { MODULES, QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import SemInput from '@/components/SemInput';
import SchoolYearInput from '@/components/SchoolYearInput';
import HasPermission from '@/components/HasPermission';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddGpoaForm from '@/components/forms/AddGpoaForm';

export default function Gpoa() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const {
    data: gpoas,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.GPOA],
    queryFn: gpoaService.getAll,
  });

  if (error) {
    return <p>Error loading GPOA plans. Please refresh.</p>;
  }

  // Sort by createdAt descending (latest to oldest)
  const sortedGpoas = gpoas?.data
    ? [...gpoas.data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    : [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <Header>General Plan of Action (GPOA)</Header>

        <HasPermission permissions={[MODULES.GPOA_CREATE]}>
          <AddGpoaForm />
        </HasPermission>
      </StickyHeader>

      <div className="flex items-end flex-wrap gap-3 mb-6">
        <SemInput />
        <SchoolYearInput />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar View (Left) */}
        <div className="xl:col-span-8 flex flex-col  rounded-lg border shadow-sm p-4 overflow-x-auto min-h-[600px]">
          <div className="flex items-center justify-between mb-4 min-w-[600px]">
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

          <div className="grid grid-cols-7 border-t border-l min-w-[600px]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-sm py-2 border-b border-r bg-muted/30"
              >
                {day}
              </div>
            ))}

            {daysInMonth.map((day, idx) => {
              const dayPlans = sortedGpoas.filter((p) =>
                isSameDay(new Date(p.targetDate), day),
              );

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-b border-r p-1 ${
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
                      <AddGpoaForm
                        key={plan._id}
                        mode="edit"
                        gpoa={plan}
                        trigger={
                          <div
                            className="bg-primary/10 hover:bg-primary/20 text-[10px] px-1.5 py-1 rounded cursor-pointer truncate font-medium border border-primary/20"
                            title={plan.name}
                          >
                            <span
                              className={`${
                                plan.status === 'completed'
                                  ? 'text-primary'
                                  : plan.status === 'cancelled'
                                    ? 'text-red-500'
                                    : 'text-black'
                              }`}
                            >
                              {plan.name}
                            </span>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card View (Right) */}
        <div className="xl:col-span-4 flex flex-col xl:relative h-[600px] xl:h-auto">
          <div className="xl:absolute xl:inset-0 flex flex-col gap-4 h-full">
            <h3 className="text-lg font-semibold shrink-0">All Plans</h3>
            {isLoading ? (
              <p className="text-muted-foreground">Loading plans...</p>
            ) : sortedGpoas.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card/50 border-dashed">
                <p className="text-muted-foreground">
                  No plans found for this term.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-10 flex-1">
                {sortedGpoas.map((gpoa) => (
                  <AddGpoaForm
                    key={`card-${gpoa._id}`}
                    mode="edit"
                    gpoa={gpoa}
                    trigger={
                      <Card className="cursor-pointer hover:border-primary/50 transition-colors text-left shrink-0">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-lg leading-tight">
                              {gpoa.name}
                            </CardTitle>
                            <Badge
                              className="shrink-0"
                              variant={
                                gpoa.status === 'completed'
                                  ? 'default'
                                  : gpoa.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {gpoa.status.toUpperCase()}
                            </Badge>
                          </div>
                          <CardDescription>
                            {format(new Date(gpoa.targetDate), 'PPP')} &middot;{' '}
                            {gpoa.venue}
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
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarPageLayout>
  );
}
