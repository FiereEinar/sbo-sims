import { useState, useRef, useEffect } from 'react';
import { EventSession } from '@/types/event';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScanBarcode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { recordAttendance } from '@/api/attendance';
import { queryClient } from '@/main';
import { QUERY_KEYS, MODULES } from '@/constants';
import HasPermission from '../HasPermission';

type AttendanceScannerProps = {
  session: EventSession;
};

export default function AttendanceScanner({ session }: AttendanceScannerProps) {
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    message: string;
    studentName?: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input if session is active
  useEffect(() => {
    if (session.status === 'active' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [session.status]);

  // Clear the scan result message after 3 seconds
  useEffect(() => {
    if (lastScanResult) {
      // Small delay to ensure the component is mounted before starting the transition
      setTimeout(() => setIsVisible(true), 10);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for the exit animation to finish before removing from DOM
        setTimeout(() => setLastScanResult(null), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScanResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || session.status !== 'active') return;

    setIsLoading(true);
    setLastScanResult(null);

    const currentId = studentId.trim();

    // Clear input immediately for next scan
    setStudentId('');

    try {
      const res = await recordAttendance(session._id, currentId);
      setLastScanResult({
        success: true,
        message: 'Attendance recorded successfully',
        studentName: `${res.data.student.firstname} ${res.data.student.lastname}`,
      });

      // Invalidate attendance query
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENT, session._id, 'attendance'],
        exact: false, // Make sure it invalidates all pages
      });
    } catch (err: any) {
      setLastScanResult({
        success: false,
        message: err.message || 'Failed to record attendance',
      });
    } finally {
      setIsLoading(false);
      // Keep focus on input after React re-renders and removes the disabled attribute
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const isActive = session.status === 'active';

  const FallbackScanner = (
    <div className="space-y-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center">
        <div className="relative flex-1">
          <ScanBarcode className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="You do not have permission to record attendance"
            className="pl-14 h-14 text-lg rounded-r-none rounded-l-full"
            disabled={true}
          />
        </div>
        <Button disabled className="h-14 px-8 rounded-l-none rounded-r-full">
          Submit
        </Button>
      </div>
    </div>
  );

  return (
    <HasPermission permissions={[MODULES.ATTENDANCE_RECORD_CREATE]} fallback={FallbackScanner}>
      <div className="space-y-4 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                ref={inputRef}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Scan or type Student ID and press Enter..."
                className="pl-14 h-14 text-lg rounded-r-none rounded-l-full"
                disabled={!isActive || isLoading}
                autoFocus={isActive}
                autoComplete="off"
              />
            </div>
            <Button
              type="submit"
              disabled={!isActive || isLoading || !studentId.trim()}
              className="h-14 px-8 rounded-l-none rounded-r-full"
            >
              Submit
            </Button>
          </div>
        </form>

        {!isActive && (
          <div className="space-y-1 rounded-lg border p-3 shadow-sm border-gray-200 dark:border-gray-700 bg-muted">
            <div className="flex gap-2 items-center">
              <AlertCircle className="h-4 w-4" />
              <h4 className="font-semibold">Session not active</h4>
            </div>
            <p className="text-sm">
              Start the session using the controls above to begin recording
              attendance.
            </p>
          </div>
        )}

        {lastScanResult && (
          <div
            className={
              `space-y-1 rounded-lg border p-3 shadow-sm transition-all duration-300 ease-out transform ${
                isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
              } ` +
              (lastScanResult.success
                ? 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900'
                : 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900')
            }
          >
            <div className="flex gap-2 items-center">
              {lastScanResult.success ? (
                <CheckCircle2 className="h-4 w-4 !text-green-600 dark:!text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <h4 className="font-semibold">
                {lastScanResult.success ? lastScanResult.studentName : 'Error'}
              </h4>
            </div>

            <p className="text-sm">{lastScanResult.message}</p>
          </div>
        )}
      </div>
    </HasPermission>
  );
}
