/**
 * preload.js
 * 
 * Electron preload script — runs in a privileged context and safely exposes
 * a minimal IPC API to the renderer (React app) via contextBridge.
 * 
 * Exposes window.electronAPI for sync status events.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Listen for sync status updates broadcast by the SyncEngine.
   * @param {Function} callback - Called with { status, clientId, isOnline, lastError, clockSkewMs, clockSkewWarning }
   * @returns {Function} unsubscribe function
   */
  onSyncStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('sync:status', handler);
    // Return cleanup function for React useEffect
    return () => ipcRenderer.removeListener('sync:status', handler);
  },

  /**
   * Request the current sync status (one-time query).
   */
  getSyncStatus: () => {
    ipcRenderer.send('sync:get-status');
  },

  /**
   * Send auth context to the SyncEngine so it can call authenticated
   * local Express endpoints. Call this after the user logs in.
   * @param {string} authCookie - The session cookie value
   * @param {string} organizationId - Active organization ObjectId
   */
  setSyncContext: (authCookie, organizationId) => {
    ipcRenderer.send('sync:set-context', { authCookie, organizationId });
  },

  /** True if running inside Electron desktop app */
  isElectron: true,
});
