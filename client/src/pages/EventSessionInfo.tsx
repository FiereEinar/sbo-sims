import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import BackButton from '@/components/buttons/BackButton';
import { fetchEventSessions } from '@/api/eventSession';
import {
  fetchSessionAttendance,
  getAttendanceDownloadURL,
  AttendanceFilterValues,
} from '@/api/attendance';
import { QUERY_KEYS, MODULES } from '@/constants';
import SessionControls from '@/components/event/SessionControls';
import AttendanceScanner from '@/components/event/AttendanceScanner';
import AttendanceRecordTable from '@/components/event/AttendanceRecordTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, FileSpreadsheet, Search } from 'lucide-react';
import { format } from 'date-fns';
import PaginationController from '@/components/PaginationController';
import HasPermission from '@/components/HasPermission';
import { queryClient } from '@/main';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import axiosInstance from '@/api/axiosInstance';
import { fetchAvailableCourses } from '@/api/student';

export default function EventSessionInfo() {
  const { eventID, sessionID } = useParams();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filter state — local only, no store needed
  const [filters, setFiltersState] = useState<AttendanceFilterValues>({
    sortBy: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [_isDownloading, setIsDownloading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFiltersState((prev) => ({
        ...prev,
        search: searchInput || undefined,
      }));
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const setFilters = useCallback((partial: Partial<AttendanceFilterValues>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  // Fetch all sessions and find this one
  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: [QUERY_KEYS.EVENT, eventID, 'sessions'],
    queryFn: () => fetchEventSessions(eventID as string),
    enabled: !!eventID,
  });

  const session = sessions?.find((s) => s._id === sessionID);

  // Fetch available courses for the Course filter dropdown
  const { data: courses = [] } = useQuery({
    queryKey: [QUERY_KEYS.STUDENT_COURSES],
    queryFn: fetchAvailableCourses,
  });

  const { data: attendanceResult, isLoading: isAttendanceLoading } = useQuery({
    queryKey: [
      QUERY_KEYS.EVENT,
      sessionID,
      'attendance',
      { page, pageSize, ...filters },
    ],
    queryFn: () =>
      fetchSessionAttendance(sessionID as string, page, pageSize, filters),
    enabled: !!sessionID,
    // Poll every 3 seconds if active to keep table up to date if multiple devices are scanning
    refetchInterval: session?.status === 'active' ? 3000 : false,
  });

  const prefetchPageFn = (prefetchPage: number) => {
    const queryKey = [
      QUERY_KEYS.EVENT,
      sessionID,
      'attendance',
      { page: prefetchPage, pageSize, ...filters },
    ];
    const data = queryClient.getQueryData(queryKey);
    if (data) return;

    queryClient.prefetchQuery({
      queryKey,
      queryFn: () =>
        fetchSessionAttendance(
          sessionID as string,
          prefetchPage,
          pageSize,
          filters,
        ),
    });
  };

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


  const handleDownload = async (type: 'pdf' | 'csv') => {
    try {
      setIsDownloading(true);
      // Pass the current filters so the downloaded file matches the table
      const url = getAttendanceDownloadURL(sessionID as string, type, filters);
      const result = await axiosInstance.get(url, { responseType: 'blob' });

      const blob = new Blob([result.data], {
        type: type === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${session?.name || 'session'}-attendance.${type}`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error downloading the file:', err);
    } finally {
      setIsDownloading(false);
    }
  };

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">Attendance Records</h3>
          </div>

          <HasPermission
            permissions={[MODULES.ATTENDANCE_RECORD_DOWNLOAD]}
            fallback={
              <Button
                variant="outline"
                disabled
                title="You do not have permission to download attendance"
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            }
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDownload('pdf')}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" /> As PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownload('csv')}
                  className="cursor-pointer"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> As CSV / Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </HasPermission>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="attendance-search"
            className="pl-9"
            placeholder="Search by name or student ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {isAttendanceLoading ? (
          <p className="text-muted-foreground">Loading records...</p>
        ) : (
          <div className="space-y-4">
            <AttendanceRecordTable
              records={attendanceResult?.data || []}
              filters={filters}
              setFilters={setFilters}
              courses={courses}
            />

            {attendanceResult && (
              <PaginationController
                currentPage={page}
                nextPage={attendanceResult.next}
                prevPage={attendanceResult.prev}
                setPage={setPage}
                prefetchFn={prefetchPageFn}
              />
            )}
          </div>
        )}
      </div>
    </SidebarPageLayout>
  );
}
