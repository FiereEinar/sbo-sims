import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import OperationLogModel, {
  SyncableEntityType,
  SyncOperation,
} from '../models/operation-log.model';
import { SYNC_ENABLED } from '../constants/env';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Client ID ───────────────────────────────────────────────────────────────
// Read the clientId from the file written by the Electron main process.
// Falls back to hostname so server-only mode still works without a file.
let _clientId: string | null = null;

function getClientId(): string {
  if (_clientId) return _clientId;

  // The Electron sync engine writes the UUID to this well-known path
  const clientIdPath = path.join(
    process.env.ELECTRON_USER_DATA_PATH || os.homedir(),
    'client-id.txt',
  );

  if (fs.existsSync(clientIdPath)) {
    _clientId = fs.readFileSync(clientIdPath, 'utf-8').trim();
  } else {
    // Fallback for non-Electron environments
    _clientId = os.hostname();
  }

  return _clientId;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function methodToOperation(method: string): SyncOperation | null {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'PUT':
      return 'update';
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return null;
  }
}

/**
 * Extracts the affected document ID from the response body.
 * Controllers return { data: { _id: ... } } via CustomResponse.
 */
function extractEntityId(body: any): mongoose.Types.ObjectId | null {
  const id = body?.data?._id ?? body?.data?.id;
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id.toString());
  } catch {
    return null;
  }
}

// ─── Middleware factory ───────────────────────────────────────────────────────
/**
 * Express middleware that intercepts successful mutating responses and writes
 * an OperationLog entry to the local MongoDB for later sync to Atlas.
 *
 * Usage in routes:
 *   router.post('/', ..., create_handler, logOperation('Transaction'));
 *
 * Important: attach AFTER the controller so it only fires on success.
 */
export const logOperation =
  (entityType: SyncableEntityType) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Skip entirely if sync is disabled
    if (SYNC_ENABLED !== 'true') {
      console.log('[Sync] Sync not enabled');
      return next();
    }

    console.log('[Sync] Sync enabled');

    const operation = methodToOperation(req.method);
    if (!operation) return next();

    // Intercept res.json to capture the response body
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      // Restore immediately to avoid double-interception
      res.json = originalJson;
      const result = originalJson(body);

      // Only log successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = extractEntityId(body);

        if (entityId && req.tenantContext?.organizationId) {
          // Build a field-level patch:
          // - For creates/updates: req.body is the payload
          // - For deletes: store empty patch (deletion is tracked by operation type)
          const patch = operation === 'delete' ? {} : { ...(req.body ?? {}) };

          // For creates, also include the assigned _id so the remote can upsert correctly
          if (operation === 'create') {
            patch._id = entityId;
          }

          OperationLogModel.create({
            clientId: getClientId(),
            entityType,
            entityId,
            operation,
            patch,
            organizationId: req.tenantContext.organizationId,
            clientTimestamp: new Date(),
            status: 'pending',
          }).catch((err: Error) => {
            console.error(
              '[OperationLog] Failed to write log entry:',
              err.message,
            );
          });
        }
      }

      return result;
    };

    next();
  };
