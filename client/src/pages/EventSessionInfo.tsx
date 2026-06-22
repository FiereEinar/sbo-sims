import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import BackButton from '@/components/buttons/BackButton';
import { fetchEventSessions } from '@/api/eventSession';
import { fetchSessionAttendance } from '@/api/attendance';
import { QUERY_KEYS } from '@/constants';
import SessionControls from '@/components/event/SessionControls';
import AttendanceScanner from '@/components/event/AttendanceScanner';
import AttendanceRecordTable from '@/components/event/AttendanceRecordTable';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function EventSessionInfo() {
  const { eventID, sessionID } = useParams();

  // Fetch all sessions and find this one
  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: [QUERY_KEYS.EVENT, eventID, 'sessions'],
    queryFn: () => fetchEventSessions(eventID as string),
    enabled: !!eventID,
  });

  const session = sessions?.find((s) => s._id === sessionID);

  const { data: attendanceRecords, isLoading: isAttendanceLoading } = useQuery({
    queryKey: [QUERY_KEYS.EVENT, sessionID, 'attendance'],
    queryFn: () => fetchSessionAttendance(sessionID as string),
    enabled: !!sessionID,
    // Poll every 3 seconds if active to keep table up to date if multiple devices are scanning
    refetchInterval: session?.status === 'active' ? 3000 : false,
  });

  if (isSessionsLoading) {
    return (
      <SidebarPageLayout>
        <p className="text-muted-foreground">Loading session info...</p>
      </SidebarPageLayout>
    );
  }

  if (!session) {
    return (
      <SidebarPageLayout>
        <BackButton />
        <div className="mt-8 text-center p-8 bg-destructive/10 rounded-lg">
          <p className="text-destructive font-medium text-lg">
            Session not found.
          </p>
        </div>
      </SidebarPageLayout>
    );
  }

  return (
    <SidebarPageLayout>
      <BackButton />

      <StickyHeader>
        <div className="w-full flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Viewing Session</p>
            <h2 className="text-2xl font-bold">
              {session.event.title} - {session.name}
            </h2>
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <Badge variant="outline" className="capitalize">
                Status: {session.status}
              </Badge>
              {session.startedAt && (
                <span>
                  Started: {format(new Date(session.startedAt), 'h:mm a')}
                </span>
              )}
              {session.endedAt && (
                <span>
                  • Ended: {format(new Date(session.endedAt), 'h:mm a')}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 mt-2 md:mt-0">
            <SessionControls session={session} />
          </div>
        </div>
      </StickyHeader>

      <div className="mt-6 mb-8 bg-card/50 border shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">
          Record Attendance
        </h3>
        <AttendanceScanner session={session} />
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Attendance Records</h3>
          <Badge variant="secondary">
            {attendanceRecords?.length || 0} Scanned
          </Badge>
        </div>

        {isAttendanceLoading ? (
          <p className="text-muted-foreground">Loading records...</p>
        ) : (
          <AttendanceRecordTable records={attendanceRecords || []} />
        )}
      </div>
    </SidebarPageLayout>
  );
}
