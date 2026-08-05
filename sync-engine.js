/**
 * sync-engine.js
 *
 * Runs in the Electron main process. Manages bidirectional sync between the
 * local mongod.exe database and MongoDB Atlas.
 *
 * Flow:
 *   1. On startup, generate/read a persistent clientId UUID
 *   2. Ping the Atlas health endpoint periodically to detect connectivity
 *   3. On confirmed online: run PUSH (local → Atlas) then PULL (Atlas → local)
 *   4. Emit IPC events so the renderer can show a sync status badge
 */

const { net, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

// ─── Configuration ────────────────────────────────────────────────────────────
const HEALTH_PING_INTERVAL_MS = 30_000; // check connectivity every 30s
const POLL_INTERVAL_MS = 5_000; // pull new changes every 30s while online
const PUSH_BATCH_SIZE = 50; // ops per push batch
const CLOCK_SKEW_WARN_MS = 5 * 60_000; // warn if clocks differ by > 5 minutes

const BOOTSTRAP_COLLECTIONS = [
  'users',
  'roles',
  'categories',
  'students',
  'transactions',
  'prelistings',
  'events',
  'eventsessions',
  'attendancerecords',
  'paymentrequests',
  'gpoas',
];

// ─── State ────────────────────────────────────────────────────────────────────
let isOnline = false;
let isSyncing = false;
let syncStatus = 'offline'; // 'offline' | 'syncing' | 'synced' | 'error'
let lastError = null;
let pollTimer = null;
let clientId = null;
let mainWindow = null;
let localApiUrl = 'http://localhost:3000';
let atlasHealthUrl = '';
let userDataPath = '';

// ─── Client ID ────────────────────────────────────────────────────────────────
function initClientId(userDataDir) {
  userDataPath = userDataDir;
  const clientIdPath = path.join(userDataDir, 'client-id.txt');

  if (fs.existsSync(clientIdPath)) {
    clientId = fs.readFileSync(clientIdPath, 'utf-8').trim();
  } else {
    clientId = randomUUID();
    fs.writeFileSync(clientIdPath, clientId, 'utf-8');
  }

  // Also write to a well-known path so the local Express server can read it
  fs.writeFileSync(path.join(userDataDir, 'client-id.txt'), clientId, 'utf-8');

  // Expose via env var so the operation-log middleware can read it
  process.env.ELECTRON_USER_DATA_PATH = userDataDir;

  return clientId;
}

// ─── HTTP helpers (using Electron's net module) ───────────────────────────────
function netRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = net.request({
      url,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    let responseData = '';

    req.on('response', (res) => {
      res.on('data', (chunk) => {
        responseData += chunk.toString();
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// ─── Status broadcasting ──────────────────────────────────────────────────────
function emitStatus(status, extra = {}) {
  syncStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync:status', {
      status,
      clientId,
      lastError,
      isOnline,
      ...extra,
    });
  }
}

// ─── Health ping + clock skew ─────────────────────────────────────────────────
async function pingHealth(authCookie) {
  logToFile(`[SyncEngine] Health ping: ${authCookie}`);
  try {
    const { status, body } = await netRequest(`${atlasHealthUrl}/sync/health`, {
      headers: {
        Authorization: `Bearer ${authCookie}`,
      },
    });
    if (status === 200 && body.ok) {
      // Check clock skew
      const serverTime = new Date(body.serverTime).getTime();
      const clientTime = Date.now();
      const skewMs = clientTime - serverTime;

      // Report skew to renderer for optional UI warning
      if (Math.abs(skewMs) > CLOCK_SKEW_WARN_MS) {
        emitStatus(syncStatus, { clockSkewMs: skewMs, clockSkewWarning: true });
      }

      // Also persist clockSkewMs to local DB via the local API
      await netRequest(`${localApiUrl}/sync/checkpoint`, {
        method: 'PATCH',
        body: { clockSkewMs: skewMs },
        headers: {
          Authorization: `Bearer ${authCookie}`,
        },
      }).catch(() => {}); // best-effort

      return true;
    }
    return false;
  } catch (error) {
    logToFile(
      `[SyncEngine] Health ping failed: ${JSON.stringify(error.message)}`,
    );
    return false;
  }
}

// ─── PUSH phase (local → Atlas) ───────────────────────────────────────────────
async function runPush(authCookie) {
  if (!authCookie) {
    logToFile(
      '[SyncEngine] Warning: Context received without valid authCookie',
    );
    return;
  }

  let pushed = 0;
  let hasMore = true;

  while (hasMore) {
    // 1. Fetch a batch of pending/in_flight ops from local Express
    let batchRes;
    try {
      batchRes = await netRequest(
        `${localApiUrl}/sync/pending-ops?limit=${PUSH_BATCH_SIZE}`,
        {
          headers: {
            Authorization: `Bearer ${authCookie}`,
          },
        },
      );
    } catch (err) {
      logToFile(`[SyncEngine] Push fetch failed: ${err.message}`);
      return false;
    }

    const ops = batchRes.body?.data?.ops ?? [];
    if (ops.length === 0) {
      hasMore = false;
      break;
    }

    const opIds = ops.map((o) => o._id);

    // 2. Mark them as in_flight
    await netRequest(`${localApiUrl}/sync/mark-in-flight`, {
      method: 'PATCH',
      body: { opIds },
      headers: { Cookie: authCookie },
    }).catch(() => {});

    // 3. POST batch to Atlas
    let pushRes;
    try {
      pushRes = await netRequest(`${atlasHealthUrl}/sync/push`, {
        method: 'POST',
        body: { ops },
        headers: { Cookie: authCookie },
      });
    } catch (err) {
      // Network died mid-push — leave ops as in_flight so next sync retries them
      logToFile(`[SyncEngine] Push to Atlas failed: ${err.message}`);
      return false;
    }

    if (pushRes.status !== 200) {
      logToFile(
        `[SyncEngine] Atlas push rejected: ${JSON.stringify(pushRes.body)}`,
      );
      return false;
    }

    // 4. Mark ops as synced locally
    await netRequest(`${localApiUrl}/sync/mark-synced`, {
      method: 'PATCH',
      body: { opIds },
      headers: { Cookie: authCookie },
    }).catch(() => {});

    pushed += pushRes.body?.data?.accepted ?? 0;
    hasMore = ops.length === PUSH_BATCH_SIZE;
  }

  logToFile(`[SyncEngine] Push complete — ${pushed} ops accepted`);
  return true;
}

// ─── PULL phase (Atlas → local) ───────────────────────────────────────────────
async function runPull(authCookie, organizationId) {
  if (!authCookie) {
    logToFile(
      '[SyncEngine] Warning: Context received without valid authCookie',
    );
    return;
  }

  // Read current checkpoint
  let checkpoint;
  try {
    const res = await netRequest(`${localApiUrl}/sync/checkpoint`, {
      headers: {
        Authorization: `Bearer ${authCookie}`,
      },
    });
    checkpoint = res.body?.data ?? { lastPulledSeq: 0 };
  } catch (err) {
    logToFile(`[SyncEngine] Pull checkpoint read failed: ${err.message}`);
    return false;
  }

  let lastSeq = checkpoint.lastPulledSeq ?? 0;
  let hasMore = true;
  let pulled = 0;

  while (hasMore) {
    let pullRes;
    try {
      pullRes = await netRequest(
        `${atlasHealthUrl}/sync/pull?since=${lastSeq}&excludeClient=${clientId}&organizationId=${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${authCookie}`,
          },
        },
      );
    } catch (err) {
      logToFile(`[SyncEngine] Pull from Atlas failed: ${err.message}`);
      return false;
    }

    if (pullRes.status !== 200) {
      logToFile(
        `[SyncEngine] Atlas pull failed: ${JSON.stringify(pullRes.body)}`,
      );
      return false;
    }

    const { changes, hasMore: more } = pullRes.body?.data ?? {};
    if (!changes || changes.length === 0) break;

    // Apply each change to the local database via local Express
    for (const change of changes) {
      await netRequest(`${localApiUrl}/sync/apply-change`, {
        method: 'POST',
        body: { change },
        headers: { Cookie: authCookie },
      }).catch((err) => {
        logToFile(
          `[SyncEngine] Apply change failed for seq ${change.seq}: ${err.message}`,
        );
      });

      // Advance checkpoint after EACH successful apply — ensures resumability
      await netRequest(`${localApiUrl}/sync/checkpoint`, {
        method: 'PATCH',
        body: { lastPulledSeq: change.seq },
        headers: {
          Authorization: `Bearer ${authCookie}`,
        },
      }).catch(() => {});

      lastSeq = change.seq;
      pulled++;
    }

    hasMore = more;
  }

  logToFile(`[SyncEngine] Pull complete — ${pulled} changes applied`);
  return true;
}

// ─── PUBLIC BOOTSTRAP phase (Atlas → local dump of global public collections) ──
async function bootstrapPublicData() {
  logToFile('[SyncEngine] Bootstrapping public data (organizations)...');
  const secretKey = process.env.SECRET_ADMIN_KEY;
  if (!secretKey) {
    logToFile(
      '[SyncEngine] SECRET_ADMIN_KEY missing, skipping public bootstrap.',
    );
    return;
  }

  let page = 1;
  let hasMore = true;

  while (hasMore) {
    logToFile(`[SyncEngine] Bootstrapping organizations page ${page}...`);
    let res;
    try {
      res = await netRequest(
        `${atlasHealthUrl}/sync/bootstrap?collection=organizations&page=${page}`,
        { headers: { 'x-sync-secret': secretKey } },
      );
    } catch (err) {
      logToFile(`[SyncEngine] Public bootstrap fetch failed: ${err.message}`);
      return;
    }

    if (res.status !== 200) {
      logToFile(
        `[SyncEngine] Atlas public bootstrap rejected: ${JSON.stringify(res.body)}`,
      );
      return;
    }

    const { docs, hasMore: more } = res.body?.data ?? {};
    if (docs && docs.length > 0) {
      let applyRes;
      try {
        applyRes = await netRequest(
          `${localApiUrl}/sync/apply-bootstrap-batch`,
          {
            method: 'POST',
            body: { collection: 'organizations', docs },
            headers: { 'x-sync-secret': secretKey },
          },
        );
      } catch (err) {
        logToFile(`[SyncEngine] Public bootstrap apply failed: ${err.message}`);
        return;
      }

      if (applyRes.status !== 200) {
        logToFile(
          `[SyncEngine] Local apply rejected: ${JSON.stringify(applyRes.body)}`,
        );
        return;
      }
    }

    hasMore = more;
    page++;
  }
  logToFile('[SyncEngine] Public bootstrap complete.');
}

// ─── BOOTSTRAP phase (Atlas → local full dump) ────────────────────────────────
async function runBootstrap(authCookie, organizationId) {
  if (!authCookie) {
    logToFile(
      '[SyncEngine] Warning: Context received without valid authCookie',
    );
    return;
  }

  logToFile('[SyncEngine] Starting first-run bootstrap...');
  emitStatus('syncing', { label: 'Bootstrapping initial data...' });

  for (const collection of BOOTSTRAP_COLLECTIONS) {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      logToFile(`[SyncEngine] Bootstrapping ${collection} page ${page}...`);
      let res;
      try {
        res = await netRequest(
          `${atlasHealthUrl}/sync/bootstrap?collection=${collection}&orgId=${organizationId}&page=${page}`,
          {
            headers: {
              Authorization: `Bearer ${authCookie}`,
            },
          },
        );
      } catch (err) {
        logToFile(
          `[SyncEngine] Bootstrap fetch failed for ${collection}: ${err.message}`,
        );
        return false;
      }

      if (res.status !== 200) {
        logToFile(
          `[SyncEngine] Atlas bootstrap rejected: ${JSON.stringify(res.body)}`,
        );
        return false;
      }

      const { docs, hasMore: more } = res.body?.data ?? {};
      if (docs && docs.length > 0) {
        // Apply batch locally
        let applyRes;
        try {
          applyRes = await netRequest(
            `${localApiUrl}/sync/apply-bootstrap-batch`,
            {
              method: 'POST',
              body: { collection, docs },
              headers: { Cookie: authCookie },
            },
          );
        } catch (err) {
          logToFile(
            `[SyncEngine] Bootstrap apply failed for ${collection}: ${err.message}`,
          );
          return false;
        }

        if (applyRes.status !== 200) {
          logToFile(
            `[SyncEngine] Local apply rejected: ${JSON.stringify(applyRes.body)}`,
          );
          return false;
        }
      }

      hasMore = more;
      page++;
    }
  }

  // Set current seq to checkpoint
  let seqRes;
  try {
    seqRes = await netRequest(`${atlasHealthUrl}/sync/current-seq`, {
      headers: { Cookie: authCookie },
    });
  } catch (err) {
    logToFile(`[SyncEngine] Failed to get current seq: ${err.message}`);
    return false;
  }

  const seq = seqRes.body?.data?.seq ?? 0;

  // Mark bootstrap complete in checkpoint
  await netRequest(`${localApiUrl}/sync/checkpoint`, {
    method: 'PATCH',
    body: { bootstrappedAt: new Date().toISOString(), lastPulledSeq: seq },
    headers: {
      Authorization: `Bearer ${authCookie}`,
    },
  }).catch(() => {});

  logToFile('[SyncEngine] Bootstrap complete!');
  return true;
}

// ─── Full sync cycle ──────────────────────────────────────────────────────────
async function runSync(authCookie, organizationId) {
  if (!authCookie) {
    logToFile(
      '[SyncEngine] Warning: Context received without valid authCookie',
    );
    return;
  }

  if (isSyncing) return;
  isSyncing = true;
  lastError = null;
  emitStatus('syncing');

  try {
    // Check if bootstrap is needed
    let checkpoint;
    try {
      const res = await netRequest(`${localApiUrl}/sync/checkpoint`, {
        headers: {
          Authorization: `Bearer ${authCookie}`,
        },
      });
      checkpoint = res.body?.data ?? { lastPulledSeq: 0 };
    } catch (err) {
      logToFile(`[SyncEngine] Checkpoint read failed: ${err.message}`);
      throw new Error('Could not read checkpoint');
    }

    if (!checkpoint.bootstrappedAt) {
      const bootOk = await runBootstrap(authCookie, organizationId);
      if (!bootOk) throw new Error('Bootstrap phase failed');
    }

    const pushOk = await runPush(authCookie);
    if (!pushOk) throw new Error('Push phase failed');

    const pullOk = await runPull(authCookie, organizationId);
    if (!pullOk) throw new Error('Pull phase failed');

    emitStatus('synced');
    logToFile('[SyncEngine] Sync cycle complete');
  } catch (err) {
    lastError = err.message;
    emitStatus('error');
    logToFile(`[SyncEngine] Sync cycle failed: ${err.message}`);
  } finally {
    isSyncing = false;
  }
}

// ─── Connectivity monitoring ──────────────────────────────────────────────────
async function checkConnectivity(authCookie, organizationId) {
  if (!authCookie) {
    logToFile(
      '[SyncEngine] Skipping connectivity check: No authCookie provided',
    );
    return;
  }

  const confirmed = await pingHealth(authCookie);

  if (confirmed && !isOnline) {
    isOnline = true;
    logToFile('[SyncEngine] Internet connection confirmed. Starting sync...');
    emitStatus('syncing');

    // Small grace period for DNS to settle after network reconnect
    await new Promise((r) => setTimeout(r, 2000));
    await runSync(authCookie, organizationId);

    // Start recurring poll while online
    if (!pollTimer) {
      pollTimer = setInterval(() => {
        runSync(authCookie, organizationId);
      }, POLL_INTERVAL_MS);
    }
  } else if (!confirmed && isOnline) {
    isOnline = false;
    emitStatus('offline');
    logToFile('[SyncEngine] Lost connectivity. Switching to offline mode.');
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }
}

// ─── Logger (reuse from main.js context) ─────────────────────────────────────
let _logToFile = (msg) => console.log(msg);

function setLogger(fn) {
  _logToFile = fn;
}

function logToFile(msg) {
  _logToFile(msg);
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
function setupIpc() {
  let cookie = null;
  ipcMain.on('sync:get-status', (event) => {
    event.reply('sync:status', {
      status: syncStatus,
      clientId,
      isOnline,
      lastError,
    });
  });

  // The renderer sends auth context after login so the sync engine can
  // call authenticated local Express endpoints
  ipcMain.on('sync:set-context', (_event, { authCookie, organizationId }) => {
    // logToFile('[SyncEngine] Current Auth Cookie: ' + authCookie);
    // logToFile(`[SyncEngine] Context set — org: ${organizationId}`);
    // Trigger immediate sync with new context
    cookie = authCookie;
    checkConnectivity(authCookie, organizationId);
  });

  return cookie;
}

// ─── Public API ───────────────────────────────────────────────────────────────
function start({ window, userDataDir, localApiBaseUrl, atlasBaseUrl, logFn }) {
  mainWindow = window;
  localApiUrl = localApiBaseUrl || 'http://localhost:3000';
  atlasHealthUrl = atlasBaseUrl || '';

  if (logFn) setLogger(logFn);

  initClientId(userDataDir);
  const authCookie = setupIpc();

  logToFile(`[SyncEngine] Started. ClientId: ${clientId}`);
  logToFile(`[SyncEngine] Local API: ${localApiUrl}`);
  logToFile(`[SyncEngine] Atlas URL: ${atlasHealthUrl}`);

  // Start periodic health pings (sync only fires when auth context is available)
  let publicBootstrapped = false;

  const performHealthPing = () => {
    pingHealth(authCookie).then((ok) => {
      if (ok !== isOnline) {
        isOnline = ok;
        emitStatus(ok ? 'synced' : 'offline');
      }

      // Run public data dump once on first successful connection
      if (ok && !publicBootstrapped) {
        publicBootstrapped = true;
        bootstrapPublicData().catch((err) => {
          logToFile(`[SyncEngine] Public bootstrap error: ${err.message}`);
          publicBootstrapped = false; // retry next ping
        });
      }
    });
  };

  // Run immediately on startup
  performHealthPing();

  // Then start periodic interval
  setInterval(performHealthPing, HEALTH_PING_INTERVAL_MS);
}

function stop() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

module.exports = { start, stop };
