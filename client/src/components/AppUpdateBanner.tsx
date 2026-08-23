/**
 * AppUpdateBanner.tsx
 *
 * Electron-only component that listens for auto-update IPC events and renders
 * a compact status banner at the bottom of the sidebar. It cycles through:
 *   idle → available → downloading (progress bar) → ready → error (retry)
 *
 * Returns null when running in the browser (non-Electron) environment.
 */
import { useEffect, useState } from 'react';
import { Download, RefreshCw, Rocket, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const isElectron =
  typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;

type UpdatePhase = 'idle' | 'available' | 'downloading' | 'ready' | 'error';

interface ProgressData {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${bps} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
}

export default function AppUpdateBanner() {
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [version, setVersion] = useState<string>('');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isElectron) return;

    const api = (window as any).electronAPI;

    const unsubAvailable = api.onUpdateAvailable(
      ({ version }: { version: string }) => {
        setVersion(version);
        setPhase('available');
        setDismissed(false);
        // Downloading starts immediately after available (see main.js)
        setTimeout(() => setPhase('downloading'), 800);
      }
    );

    const unsubProgress = api.onUpdateProgress((data: ProgressData) => {
      setProgress(data);
      setPhase('downloading');
    });

    const unsubReady = api.onUpdateReady(() => {
      setPhase('ready');
      setProgress(null);
    });

    const unsubError = api.onUpdateError(({ message }: { message: string }) => {
      setErrorMsg(message);
      setPhase('error');
      setProgress(null);
    });

    return () => {
      unsubAvailable();
      unsubProgress();
      unsubReady();
      unsubError();
    };
  }, []);

  if (!isElectron || phase === 'idle' || dismissed) return null;

  // ─── Ready state: prominent restart prompt ──────────────────────────────────
  if (phase === 'ready') {
    return (
      <div
        className={cn(
          'relative flex flex-col gap-2 rounded-lg px-3 py-2.5',
          'bg-green-500/10 border border-green-500/30',
          'text-green-600 dark:text-green-400',
          'animate-in fade-in slide-in-from-bottom-2 duration-300'
        )}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-1.5 top-1.5 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="flex items-center gap-1.5">
          <Rocket className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-semibold leading-tight">
            v{version} ready!
          </span>
        </div>

        <button
          onClick={() => (window as any).electronAPI.installUpdate()}
          className={cn(
            'w-full text-xs font-medium py-1 rounded-md',
            'bg-green-500 hover:bg-green-600 text-white',
            'transition-colors duration-150'
          )}
        >
          Restart & Install
        </button>
      </div>
    );
  }

  // ─── Error state: shows message + retry button ──────────────────────────────
  if (phase === 'error') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative flex flex-col gap-2 rounded-lg px-3 py-2.5',
                'bg-destructive/10 border border-destructive/30',
                'text-destructive',
                'animate-in fade-in slide-in-from-bottom-2 duration-300'
              )}
            >
              <button
                onClick={() => setDismissed(true)}
                className="absolute right-1.5 top-1.5 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs font-semibold">Update failed</span>
              </div>

              <button
                onClick={() => {
                  setPhase('idle');
                  setProgress(null);
                  ;(window as any).electronAPI.checkForUpdates();
                }}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5',
                  'text-xs font-medium py-1 rounded-md',
                  'bg-destructive/20 hover:bg-destructive/30',
                  'transition-colors duration-150'
                )}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[220px] text-xs break-words">
            {errorMsg || 'An unknown error occurred during the update.'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // ─── Available / Downloading state: progress bar ────────────────────────────
  const percent = progress?.percent ?? 0;
  const isDownloading = phase === 'downloading' && progress !== null;

  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-lg px-3 py-2.5',
        'bg-primary/5 border border-primary/20',
        'text-primary',
        'animate-in fade-in slide-in-from-bottom-2 duration-300'
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <Download
          className={cn(
            'h-3.5 w-3.5 flex-shrink-0',
            !isDownloading && 'animate-bounce'
          )}
        />
        <span className="text-xs font-semibold truncate">
          {isDownloading ? `Downloading v${version}` : `Update v${version} available`}
        </span>
      </div>

      {/* Progress bar (only once download starts) */}
      {isDownloading && (
        <>
          <Progress value={percent} className="h-1" />
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>{Math.round(percent)}%</span>
            <span>
              {progress
                ? `${formatBytes(progress.transferred)} / ${formatBytes(progress.total)} · ${formatSpeed(progress.bytesPerSecond)}`
                : ''}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
