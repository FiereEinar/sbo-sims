import { useQuery } from '@tanstack/react-query';
import { fetchStudentPaymentRequests } from '@/api/payment-request';
import { format } from 'date-fns';
import { useUserStore } from '@/store/user';
import NewPaymentRequestForm from '@/components/forms/NewPaymentRequestForm';
import StudentSemInput from '@/components/StudentSemInput';
import StudentSchoolYearInput from '@/components/StudentSchoolYearInput';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquareWarning,
} from 'lucide-react';
import { numberWithCommas } from '@/lib/utils';
import Header from '@/components/ui/header';

export default function StudentPaymentRequests() {
  const { user } = useUserStore((state) => state);

  // Fetch student payment requests — scoped to active term
  const { data: requests, isLoading } = useQuery({
    queryKey: [
      'student-payment-requests',
      user?.activeSemDB,
      user?.activeSchoolYearDB,
    ],
    queryFn: fetchStudentPaymentRequests,
  });

  return (
    <div className="animate-appear p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div>
          <Header>Payment Requests</Header>
          <p className="text-muted-foreground mt-2 text-sm max-w-lg">
            Submit proofs of payment for admin approval and track their
            statuses.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-[130px] md:w-[150px]">
              <StudentSemInput hideLabel />
            </div>
            <div className="w-full sm:w-[150px] md:w-[170px]">
              <StudentSchoolYearInput hideLabel />
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <NewPaymentRequestForm />
          </div>
        </div>
      </div>

      {/* Summary badge */}
      {!isLoading && requests && requests.length > 0 && (
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground px-2">
          <span>Showing</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
            {requests.length}
          </span>
          <span>requests</span>
        </div>
      )}

      {/* Data Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-2xl w-full" />
          ))}
        </div>
      ) : !requests || requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 px-6 text-muted-foreground bg-card/30 rounded-3xl border border-dashed border-muted-foreground/30 mt-6">
          <div className="bg-muted/50 p-5 rounded-full mb-5">
            <FileText className="w-14 h-14 opacity-40 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2 tracking-tight">
            No payment requests found
          </p>
          <p className="text-sm text-center max-w-sm leading-relaxed">
            You don't have any pending or past payment requests for this term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {requests.map((req) => (
            <Card
              key={req._id}
              className="flex flex-col overflow-hidden rounded-2xl hover:-translate-y-1.5 transition-all duration-300 border-muted-foreground/15 group bg-card/40"
            >
              <div className="p-6 flex-1 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      <Building className="w-3.5 h-3.5 text-primary/70" />
                      <span className="truncate">
                        {(req.organization as any)?.name ?? '—'}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {(req.category as any)?.name ?? '—'}
                    </h3>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="font-extrabold text-3xl tracking-tight text-foreground group-hover:text-primary transition-colors flex items-baseline gap-1">
                    <span className="text-xl opacity-50 mr-0.5">₱</span>
                    {numberWithCommas(req.amount)}
                  </span>
                </div>
              </div>

              {/* Error Remarks Block (if rejected) */}
              {req.status === 'rejected' && req.remarks && (
                <div className="bg-rose-500/10 px-6 py-3 border-t border-rose-500/20 flex items-start gap-2.5">
                  <MessageSquareWarning className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                    <span className="font-bold">Reason:</span> {req.remarks}
                  </p>
                </div>
              )}

              <div className="bg-muted/40 px-6 py-4 flex items-center justify-between border-t border-muted-foreground/10 mt-auto group-hover:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  <span className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                    <span>
                      {format(new Date(req.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span className="hidden sm:inline opacity-50">•</span>
                    <span>{format(new Date(req.createdAt), 'h:mm a')}</span>
                  </span>
                </div>

                {req.status === 'approved' ? (
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[0.7rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved
                  </span>
                ) : req.status === 'rejected' ? (
                  <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[0.7rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Rejected
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[0.7rem] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Pending
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
