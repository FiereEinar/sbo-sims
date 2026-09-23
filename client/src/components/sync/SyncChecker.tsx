import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import {
  CheckCircle2,
  Loader2,
  RotateCw,
  WifiOff,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export interface SyncCheckerProps {
  module:
    | 'Student'
    | 'Transaction'
    | 'Event'
    | 'EventSession'
    | 'AttendanceRecord'
    | 'Category'
    | 'Prelisting'
    | 'Gpoa'
    | 'PaymentRequest'
    | string;
  semester?: string;
  schoolYear?: string;
  eventId?: string;
  sessionId?: string;
  className?: string;
}

interface SyncCountResponse {
  isOnline: boolean;
  localCount: number | null;
  atlasCount: number | null;
  error?: string;
}

export default function SyncChecker({
  module,
  semester,
  schoolYear,
  eventId,
  sessionId,
  className = '',
}: SyncCheckerProps) {
  const [isElectron, setIsElectron] = useState(false);
  const { orgSlug } = useParams<{ orgSlug: string }>();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      setIsElectron(true);
    }
  }, []);

  const queryKey = [
    'sync-checker',
    module,
    semester,
    schoolYear,
    eventId,
    sessionId,
  ];

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<SyncCountResponse>({
      queryKey,
      queryFn: async () => {
        const res = await axiosInstance.post('/sync/module-count-check', {
          module,
          semester,
          schoolYear,
          eventId,
          sessionId,
        });
        return res.data?.data;
      },
      enabled: isElectron && !!module,
      staleTime: Infinity, // Cache result on page load until manual re-check
      refetchOnWindowFocus: false,
    });

  if (!isElectron) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-full border bg-muted/30 ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking sync...</span>
      </div>
    );
  }

  if (error || !data || data.localCount === null) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-full border bg-muted/20 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Sync check unavailable</span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-pointer"
          title="Retry sync check"
        >
          <RotateCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  if (!data.isOnline || data.atlasCount === null) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-full border bg-muted/20 ${className}`}
        title="Could not connect to cloud server"
      >
        <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
        <span>Offline (Local: {data.localCount})</span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-pointer"
          title="Retry connection"
        >
          <RotateCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  // Counts match: In Sync
  if (data.localCount === data.atlasCount) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full w-fit ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>
          In Sync (Local: <strong>{data.localCount}</strong> | Atlas:{' '}
          <strong>{data.atlasCount}</strong>)
        </span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-emerald-600/70 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors ml-1 cursor-pointer"
          title="Re-check sync"
        >
          <RotateCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  // Counts mismatch: Show count comparison and suggestion
  const localIsBigger = data.localCount > data.atlasCount;
  const suggestionAction = localIsBigger ? 'Force Push' : 'Force Pull';

  return (
    <div
      className={`inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 w-fit ${className}`}
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      <span>
        Local: <strong>{data.localCount}</strong> | Atlas:{' '}
        <strong>{data.atlasCount}</strong>
      </span>
      <span className="text-muted-foreground/60">•</span>
      <span className="text-amber-800 dark:text-amber-300">
        Suggestion: <strong>{suggestionAction}</strong> in{' '}
        {orgSlug ? (
          <Link
            to={`/${orgSlug}/data-sync`}
            className="underline underline-offset-2 hover:text-amber-950 dark:hover:text-white font-medium"
          >
            Data Sync
          </Link>
        ) : null}
      </span>
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        className="text-amber-700/70 hover:text-amber-900 dark:text-amber-300/70 dark:hover:text-amber-100 transition-colors ml-0.5 cursor-pointer"
        title="Re-check sync"
      >
        <RotateCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
