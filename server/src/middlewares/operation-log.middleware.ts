import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import OperationLogModel, {
  SyncableEntityType,
  SyncOperation,
} from '../models/operation-log.model';
import { SYNC_ENABLED } from '../constants/env';
import { AtlasChangeLogModel, AtlasCounterModel } from '../models/atlas-change-log.model';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Client ID ───────────────────────────────────────────────────────────────
// Read the clientId from the file written by the Electron main process.
// Falls back to hostname so server-only mode still works without a file.
let _clientId: string | null = null;

export function getClientId(): string {
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
    const isCloudAPI = process.env.VERCEL === '1';

    // Skip entirely if sync is disabled and we are not in cloud mode
    if (SYNC_ENABLED !== 'true' && !isCloudAPI) {
      return next();
    }

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
          // - For creates: Use the full returned document (body.data) to capture server-injected fields like organization, semester, etc.
          // - For updates: Use req.body to preserve true field-level merging (only pushing modified fields)
          // - For deletes: store empty patch
          
          let patch: Record<string, any> = {};
          
          if (operation === 'create') {
            // body.data may be a Mongoose Document. JSON stringify/parse strips out Mongoose internals.
            patch = body?.data ? JSON.parse(JSON.stringify(body.data)) : { ...(req.body ?? {}) };
            patch._id = entityId; // Ensure _id is correctly assigned
          } else if (operation === 'update') {
            patch = { ...(req.body ?? {}) };
          }

          if (isCloudAPI) {
            // Write directly to AtlasChangeLogModel for other clients to pull
            AtlasCounterModel.findOneAndUpdate(
              { _id: 'changeLogSeq' },
              { $inc: { value: 1 } },
              { upsert: true, new: true },
            )
              .then((counter) => {
                return AtlasChangeLogModel.create({
                  _id: new mongoose.Types.ObjectId(),
                  seq: counter!.value,
                  clientId: 'web-client',
                  entityType,
                  entityId,
                  operation,
                  patch,
                  organizationId: req.tenantContext!.organizationId,
                  clientTimestamp: new Date(),
                  serverTimestamp: new Date(),
                });
              })
              .catch((err: any) => {
                console.error(
                  '[OperationLog] Failed to write AtlasChangeLog entry:',
                  err.message,
                );
              });
          } else {
            // Write to OperationLog for the local sync engine to push later
            OperationLogModel.create({
              clientId: getClientId(),
              entityType,
              entityId,
              operation,
              patch,
              organizationId: req.tenantContext!.organizationId,
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
      }

      return result;
    };

    next();
  };
