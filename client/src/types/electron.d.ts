// src/types/electron.d.ts

export interface ElectronAPI {
  onSyncStatus: (callback: (data: any) => void) => () => void;
  getSyncStatus: () => void;
  setSyncContext: (authCookie: string, organizationId: string) => void;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
