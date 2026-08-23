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
   * @param {string} organizationId - Active organization ObjectId (empty for central-admin/student)
   * @param {string} role - User macro-role: 'org-admin' | 'central-admin' | 'student'
   */
  setSyncContext: (authCookie, organizationId, role) => {
    console.log('[Preload] setSyncContext called with:', {
      authCookie,
      organizationId,
      role,
    });
    ipcRenderer.send('sync:set-context', { authCookie, organizationId, role });
  },

  /**
   * Clear auth context from the SyncEngine on logout.
   * Stops the recurring poll timer and prevents further sync attempts.
   */
  clearSyncContext: () => {
    console.log('[Preload] clearSyncContext called');
    ipcRenderer.send('sync:clear-context');
  },

  /**
   * Safely invoke IPC handlers in the main process
   * @param {string} channel
   * @param {any} data
   */
  invoke: (channel, data) => {
    const validChannels = ['sync:force-push', 'sync:force-pull'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Unauthorized IPC channel: ${channel}`));
  },

  // -------------------------------------------------------------------------
  // Auto-update API
  // -------------------------------------------------------------------------

  /**
   * Fired when a new version is detected on GitHub Releases.
   * @param {Function} callback - Called with { version: string }
   * @returns {Function} unsubscribe
   */
  onUpdateAvailable: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update:available', handler);
    return () => ipcRenderer.removeListener('update:available', handler);
  },

  /**
   * Fired repeatedly during download with progress info.
   * @param {Function} callback - Called with { percent, bytesPerSecond, transferred, total }
   * @returns {Function} unsubscribe
   */
  onUpdateProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update:progress', handler);
    return () => ipcRenderer.removeListener('update:progress', handler);
  },

  /**
   * Fired when the update has been fully downloaded and is ready to install.
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  onUpdateReady: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update:ready', handler);
    return () => ipcRenderer.removeListener('update:ready', handler);
  },

  /**
   * Fired if the updater encounters an error (e.g. network interruption).
   * @param {Function} callback - Called with { message: string }
   * @returns {Function} unsubscribe
   */
  onUpdateError: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('update:error', handler);
    return () => ipcRenderer.removeListener('update:error', handler);
  },

  /** Quits the app and installs the downloaded update. */
  installUpdate: () => ipcRenderer.send('update:install'),

  /** Manually re-triggers the update check (used by the Retry button). */
  checkForUpdates: () => ipcRenderer.send('update:check'),

  /** True if running inside Electron desktop app */
  isElectron: true,
});
