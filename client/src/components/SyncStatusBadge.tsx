import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastError: string | null;
  clockSkewWarning?: boolean;
  clockSkewMs?: number;
}

const STATUS_CONFIG: Record<
  SyncStatus,
  { icon: React.FC<any>; label: string; colorClass: string; spinIcon?: boolean }
> = {
  offline: {
    icon: CloudOff,
    label: 'Offline — changes saved locally',
    colorClass: 'text-muted-foreground',
  },
  syncing: {
    icon: RefreshCw,
    label: 'Syncing with Atlas...',
    colorClass: 'text-blue-500',
    spinIcon: true,
  },
  synced: {
    icon: CheckCircle2,
    label: 'Synced',
    colorClass: 'text-green-500',
  },
  error: {
    icon: AlertTriangle,
    label: 'Sync error',
    colorClass: 'text-destructive',
  },
};

/** Detects if we're running inside the Electron desktop app */
const isElectron =
  typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;

export default function SyncStatusBadge() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'offline',
    isOnline: false,
    lastError: null,
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isElectron) return;

    const electronAPI = (window as any).electronAPI;

    // Subscribe to live status updates from the sync engine
    const unsubscribe = electronAPI.onSyncStatus((data: SyncState) => {
      setSyncState(data);
    });

    // Request current status on mount
    electronAPI.getSyncStatus();
    setVisible(true);

    return unsubscribe;
  }, []);

  // Don't render if not in Electron
  if (!isElectron || !visible) return null;

  const config = STATUS_CONFIG[syncState.status];
  const Icon = config.icon;

  const tooltipText = syncState.lastError
    ? `Sync error: ${syncState.lastError}`
    : syncState.clockSkewWarning
      ? `⚠️ Clock skew detected (${Math.round((syncState.clockSkewMs ?? 0) / 60000)}min). Check system time.`
      : config.label;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs px-2 py-1 rounded-md cursor-default',
              'transition-all duration-300',
              config.colorClass,
              syncState.clockSkewWarning && 'ring-1 ring-yellow-400/50',
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5 flex-shrink-0',
                config.spinIcon && 'animate-spin',
              )}
            />
            <span className="hidden md:inline font-medium">
              {syncState.status === 'offline'
                ? 'Offline'
                : syncState.status === 'syncing'
                  ? 'Syncing…'
                  : syncState.status === 'synced'
                    ? 'Synced'
                    : 'Sync Error'}
            </span>
            {syncState.clockSkewWarning && (
              <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px] text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
