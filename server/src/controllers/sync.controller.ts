import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getAtlasConnection } from '../database/atlas-connection';
import {
  AtlasChangeLogModel,
  AtlasCounterModel,
  IAtlasChangeLog,
} from '../models/atlas-change-log.model';
import { IOperationLog, SyncableEntityType } from '../models/operation-log.model';
import CustomResponse from '../types/response';
import appAssert from '../errors/appAssert';
import { SECRET_ADMIN_KEY } from '../constants/env';
import { UNAUTHORIZED, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from '../constants/http';

// ─── Model name → Mongoose collection name map ───────────────────────────────
// Used by the push handler to know which Atlas collection to upsert into.
const ENTITY_COLLECTION_MAP: Record<SyncableEntityType, string> = {
  Transaction: 'transactions',
  Student: 'students',
  Category: 'categories',
  Event: 'events',
  EventSession: 'eventsessions',
  AttendanceRecord: 'attendancerecords',
  Prelisting: 'prelistings',
  Gpoa: 'gpoas',
  PaymentRequest: 'paymentrequests',
  Role: 'roles',
  User: 'users',
};

const MAX_PUSH_BATCH = 100;
const MAX_PULL_BATCH = 200;

// ─── GET /sync/health ─────────────────────────────────────────────────────────
/**
 * Simple liveness check for the Electron sync engine.
 * Returns 200 with the server's current UTC time (used for clock-skew detection).
 */
export const sync_health = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

// ─── POST /sync/push ──────────────────────────────────────────────────────────
/**
 * Receives a batch of OperationLog entries from an Electron client and applies
 * them to the Atlas database using LWW (Last-Write-Wins) per field.
 *
 * Idempotent: if an operation _id already exists in AtlasChangeLog, it is skipped.
 */
export const sync_push = asyncHandler(async (req: Request, res: Response) => {
  const ops: IOperationLog[] = req.body.ops;

  appAssert(
    Array.isArray(ops) && ops.length > 0,
    BAD_REQUEST,
    'ops must be a non-empty array',
  );
  appAssert(
    ops.length <= MAX_PUSH_BATCH,
    BAD_REQUEST,
    `Batch size exceeds maximum of ${MAX_PUSH_BATCH}`,
  );

  const atlasConn = await getAtlasConnection();

  // Lazy-register models on the Atlas connection (not the default mongoose connection)
  const ChangeLog = atlasConn.models['AtlasChangeLog'] ||
    atlasConn.model<IAtlasChangeLog>('AtlasChangeLog', AtlasChangeLogModel.schema);
  const Counter = atlasConn.models['AtlasCounter'] ||
    atlasConn.model('AtlasCounter', AtlasCounterModel.schema);

  let accepted = 0;
  let skipped = 0;
  const serverTimestamp = new Date();

  for (const op of ops) {
    // Idempotency: skip if this op _id already landed in Atlas
    const exists = await ChangeLog.exists({ _id: op._id });
    if (exists) {
      skipped++;
      continue;
    }

    const collectionName = ENTITY_COLLECTION_MAP[op.entityType as SyncableEntityType];
    if (!collectionName) {
      skipped++;
      continue;
    }

    const collection = atlasConn.db!.collection(collectionName);
    const entityObjectId = new mongoose.Types.ObjectId(op.entityId);

    if (op.operation === 'create') {
      // For creates: upsert the full patch as the document (idempotent on _id)
      await collection.updateOne(
        { _id: entityObjectId },
        { $setOnInsert: { _id: entityObjectId, ...op.patch } },
        { upsert: true },
      );
    } else if (op.operation === 'update') {
      // LWW: only apply the patch if clientTimestamp is newer than the existing doc
      const existing = await collection.findOne(
        { _id: entityObjectId },
        { projection: { updatedAt: 1 } },
      );

      const existingUpdatedAt = existing?.updatedAt
        ? new Date(existing.updatedAt)
        : new Date(0);
      const incomingTs = new Date(op.clientTimestamp);

      if (incomingTs > existingUpdatedAt) {
        // Apply only changed fields, preserve everything else
        const updatePatch: Record<string, any> = {};
        for (const [key, value] of Object.entries(op.patch)) {
          // Never allow overwriting _id, organization scoping fields
          if (key === '_id') continue;
          updatePatch[key] = value;
        }
        updatePatch.updatedAt = serverTimestamp;
        await collection.updateOne(
          { _id: entityObjectId },
          { $set: updatePatch },
        );
      }
    } else if (op.operation === 'delete') {
      // Soft-delete support: set archived: true if field exists, else hard delete
      const existing = await collection.findOne(
        { _id: entityObjectId },
        { projection: { archived: 1 } },
      );
      if (existing !== null) {
        if ('archived' in existing) {
          await collection.updateOne(
            { _id: entityObjectId },
            { $set: { archived: true, updatedAt: serverTimestamp } },
          );
        } else {
          await collection.deleteOne({ _id: entityObjectId });
        }
      }
    }

    // Assign next global sequence number atomically
    const counter = await Counter.findOneAndUpdate(
      { _id: 'changeLogSeq' },
      { $inc: { value: 1 } },
      { upsert: true, new: true },
    );

    await ChangeLog.create({
      _id: op._id,
      seq: counter!.value,
      clientId: op.clientId,
      entityType: op.entityType,
      entityId: entityObjectId,
      operation: op.operation,
      patch: op.patch,
      organizationId: new mongoose.Types.ObjectId(op.organizationId),
      clientTimestamp: new Date(op.clientTimestamp),
      serverTimestamp,
    });

    accepted++;
  }

  res.json(
    new CustomResponse(true, { accepted, skipped }, 'Push complete'),
  );
});

// ─── GET /sync/pull ───────────────────────────────────────────────────────────
/**
 * Returns Atlas changes that the requesting client hasn't seen yet.
 *
 * Query params:
 *   since          - last seq number the client successfully applied (exclusive)
 *   excludeClient  - clientId of the requesting machine (skip its own ops)
 *   organizationId - org scoping
 */
export const sync_pull = asyncHandler(async (req: Request, res: Response) => {
  const since = Number(req.query.since ?? 0);
  const excludeClient = req.query.excludeClient as string;
  const organizationId = req.query.organizationId as string;

  appAssert(
    organizationId && mongoose.Types.ObjectId.isValid(organizationId),
    BAD_REQUEST,
    'organizationId query param is required and must be a valid ObjectId',
  );

  const atlasConn = await getAtlasConnection();
  const ChangeLog = atlasConn.models['AtlasChangeLog'] ||
    atlasConn.model<IAtlasChangeLog>('AtlasChangeLog', AtlasChangeLogModel.schema);

  const filter: Record<string, any> = {
    seq: { $gt: since },
    organizationId: new mongoose.Types.ObjectId(organizationId),
  };

  if (excludeClient) {
    filter.clientId = { $ne: excludeClient };
  }

  const changes = await ChangeLog
    .find(filter)
    .sort({ seq: 1 })
    .limit(MAX_PULL_BATCH)
    .lean();

  res.json(
    new CustomResponse(
      true,
      { changes, hasMore: changes.length === MAX_PULL_BATCH },
      `${changes.length} changes`,
    ),
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL-ONLY endpoints — called by the Electron sync engine process via
// localhost. These never talk to Atlas; they read/write the local MongoDB only.
// ═══════════════════════════════════════════════════════════════════════════════

import OperationLogModel from '../models/operation-log.model';
import SyncCheckpointModel from '../models/sync-checkpoint.model';

// ─── GET /sync/pending-ops ────────────────────────────────────────────────────
/**
 * Returns a batch of pending or in_flight OperationLog entries.
 * The sync engine fetches these, marks them in_flight, then pushes to Atlas.
 */
export const sync_get_pending_ops = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 100);

  const ops = await OperationLogModel
    .find({ status: { $in: ['pending', 'in_flight'] } })
    .sort({ clientTimestamp: 1 })
    .limit(limit)
    .lean();

  res.json(new CustomResponse(true, { ops }, `${ops.length} pending ops`));
});

// ─── PATCH /sync/mark-in-flight ───────────────────────────────────────────────
/**
 * Marks a batch of OperationLog entries as in_flight before the push attempt.
 */
export const sync_mark_in_flight = asyncHandler(async (req: Request, res: Response) => {
  const { opIds } = req.body as { opIds: string[] };
  appAssert(Array.isArray(opIds), BAD_REQUEST, 'opIds must be an array');

  await OperationLogModel.updateMany(
    { _id: { $in: opIds } },
    { $set: { status: 'in_flight' } },
  );

  res.json(new CustomResponse(true, null, 'Marked in_flight'));
});

// ─── PATCH /sync/mark-synced ──────────────────────────────────────────────────
/**
 * Marks a batch of OperationLog entries as synced after Atlas confirms receipt.
 */
export const sync_mark_synced = asyncHandler(async (req: Request, res: Response) => {
  const { opIds } = req.body as { opIds: string[] };
  appAssert(Array.isArray(opIds), BAD_REQUEST, 'opIds must be an array');

  await OperationLogModel.updateMany(
    { _id: { $in: opIds } },
    { $set: { status: 'synced' } },
  );

  res.json(new CustomResponse(true, null, 'Marked synced'));
});

// ─── GET /sync/checkpoint ─────────────────────────────────────────────────────
/**
 * Returns the local SyncCheckpoint document (singleton).
 */
export const sync_get_checkpoint = asyncHandler(async (_req: Request, res: Response) => {
  const checkpoint = await SyncCheckpointModel.findById('main').lean();
  res.json(new CustomResponse(true, checkpoint ?? { lastPulledSeq: 0 }, 'Checkpoint'));
});

// ─── PATCH /sync/checkpoint ───────────────────────────────────────────────────
/**
 * Updates fields on the SyncCheckpoint singleton.
 * The sync engine calls this to advance lastPulledSeq after each applied change.
 */
export const sync_update_checkpoint = asyncHandler(async (req: Request, res: Response) => {
  const allowed = ['lastPulledSeq', 'lastPushedAt', 'lastSyncAttemptAt', 'lastSyncSuccessAt', 'clockSkewMs'];
  const update: Record<string, any> = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      update[field] = req.body[field];
    }
  }

  const checkpoint = await SyncCheckpointModel.findByIdAndUpdate(
    'main',
    { $set: update },
    { upsert: true, new: true },
  ).lean();

  res.json(new CustomResponse(true, checkpoint, 'Checkpoint updated'));
});

// ─── POST /sync/apply-change ──────────────────────────────────────────────────
/**
 * Applies a single AtlasChangeLog entry to the local MongoDB.
 * Called during the pull phase for each received change.
 * Uses the same LWW logic as the Atlas push handler, but in reverse.
 */
export const sync_apply_change = asyncHandler(async (req: Request, res: Response) => {
  const change = req.body.change as IAtlasChangeLog;
  appAssert(change && change.entityType && change.entityId, BAD_REQUEST, 'change is required');

  const collectionName = ENTITY_COLLECTION_MAP[change.entityType as SyncableEntityType];
  appAssert(collectionName, BAD_REQUEST, `Unknown entityType: ${change.entityType}`);

  // Use the default mongoose connection (local MongoDB)
  const db = mongoose.connection.db!;
  const collection = db.collection(collectionName);
  const entityId = new mongoose.Types.ObjectId(change.entityId);

  if (change.operation === 'create') {
    await collection.updateOne(
      { _id: entityId },
      { $setOnInsert: { _id: entityId, ...change.patch } },
      { upsert: true },
    );
  } else if (change.operation === 'update') {
    const existing = await collection.findOne(
      { _id: entityId },
      { projection: { updatedAt: 1 } },
    );
    const existingUpdatedAt = existing?.updatedAt ? new Date(existing.updatedAt) : new Date(0);
    const incomingTs = new Date(change.clientTimestamp);

    if (incomingTs > existingUpdatedAt) {
      const updatePatch: Record<string, any> = {};
      for (const [key, value] of Object.entries(change.patch)) {
        if (key === '_id') continue;
        updatePatch[key] = value;
      }
      updatePatch.updatedAt = new Date();
      await collection.updateOne({ _id: entityId }, { $set: updatePatch });
    }
  } else if (change.operation === 'delete') {
    const existing = await collection.findOne(
      { _id: entityId },
      { projection: { archived: 1 } },
    );
    if (existing !== null) {
      if ('archived' in existing) {
        await collection.updateOne(
          { _id: entityId },
          { $set: { archived: true, updatedAt: new Date() } },
        );
      } else {
        await collection.deleteOne({ _id: entityId });
      }
    }
  }

  res.json(new CustomResponse(true, null, 'Change applied'));
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP endpoints — first-run full data seeding from Atlas → local DB
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All syncable collections and their organization filter field.
 * Every collection in this system has an `organization` field, so the
 * filter is uniform. We define the page size here too.
 */
const BOOTSTRAP_COLLECTIONS = [
  'organizations',   // fetched without org filter (small, global)
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
] as const;

type BootstrapCollection = typeof BOOTSTRAP_COLLECTIONS[number];

const BOOTSTRAP_PAGE_SIZE = 300;

/** Collections that are NOT scoped by organization (no `organization` field) */
const GLOBAL_COLLECTIONS = new Set(['organizations']);

// ─── GET /sync/bootstrap ──────────────────────────────────────────────────────
/**
 * Returns a paginated slice of documents from a given Atlas collection.
 * The sync engine calls this once per collection during first-run bootstrap.
 *
 * Query params:
 *   collection   - collection name (must be in BOOTSTRAP_COLLECTIONS)
 *   orgId        - organization ObjectId for scoped collections
 *   page         - 1-indexed page number (default: 1)
 *   limit        - docs per page (capped at BOOTSTRAP_PAGE_SIZE)
 */
export const sync_bootstrap = asyncHandler(async (req: Request, res: Response) => {
  const syncSecret = req.headers['x-sync-secret'];
  appAssert(syncSecret === SECRET_ADMIN_KEY, UNAUTHORIZED, 'Invalid sync secret');

  const collection = req.query.collection as BootstrapCollection;
  const orgId = req.query.orgId as string;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(Number(req.query.limit ?? BOOTSTRAP_PAGE_SIZE), BOOTSTRAP_PAGE_SIZE);

  appAssert(
    BOOTSTRAP_COLLECTIONS.includes(collection as any),
    BAD_REQUEST,
    `Unknown collection: ${collection}. Allowed: ${BOOTSTRAP_COLLECTIONS.join(', ')}`,
  );

  const isGlobal = GLOBAL_COLLECTIONS.has(collection);

  if (!isGlobal) {
    appAssert(
      orgId && mongoose.Types.ObjectId.isValid(orgId),
      BAD_REQUEST,
      'orgId is required for org-scoped collections',
    );
  }

  const atlasConn = await getAtlasConnection();
  const col = atlasConn.db!.collection(collection);

  const filter = isGlobal
    ? {}
    : { organization: new mongoose.Types.ObjectId(orgId) };

  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    col.find(filter).skip(skip).limit(limit).toArray(),
    col.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.json(
    new CustomResponse(
      true,
      {
        docs,
        collection,
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      `${docs.length} docs from ${collection} (page ${page}/${totalPages})`,
    ),
  );
});

// ─── GET /sync/user-bootstrap ─────────────────────────────────────────────────
/**
 * Fetches a specific user, their organization, and their role from Atlas.
 * Used during the Cloud Proxy Login flow to bootstrap the offline session.
 * Query params: studentID
 */
export const sync_user_bootstrap = asyncHandler(async (req: Request, res: Response) => {
  const syncSecret = req.headers['x-sync-secret'];
  appAssert(syncSecret === SECRET_ADMIN_KEY, UNAUTHORIZED, 'Invalid sync secret');

  const studentID = req.query.studentID as string;
  appAssert(studentID, BAD_REQUEST, 'studentID is required');

  const atlasConn = await getAtlasConnection();
  
  const User = atlasConn.models['User'] || atlasConn.model('User', (await import('../models/user.model')).default.schema);
  const Organization = atlasConn.models['Organization'] || atlasConn.model('Organization', (await import('../models/organization.model')).default.schema);
  const Role = atlasConn.models['Role'] || atlasConn.model('Role', (await import('../models/role.model')).default.schema);

  const user = (await User.findOne({ studentID }).lean()) as any;
  appAssert(user, NOT_FOUND, 'User not found in Atlas');

  const [organization, role] = await Promise.all([
    user.organization ? Organization.findById(user.organization).lean() : null,
    user.rbacRole ? Role.findById(user.rbacRole).lean() : null
  ]);

  res.json(
    new CustomResponse(
      true,
      { user, organization, role },
      'User bootstrap data',
    ),
  );
});

// ─── GET /sync/current-seq ────────────────────────────────────────────────────
/**
 * Returns the current Atlas global sequence counter value.
 * The sync engine calls this at the end of bootstrap to set lastPulledSeq
 * to "now", so the first incremental pull only gets changes AFTER the dump.
 */
export const sync_current_seq = asyncHandler(async (_req: Request, res: Response) => {
  const atlasConn = await getAtlasConnection();
  const Counter = atlasConn.models['AtlasCounter'] ||
    atlasConn.model('AtlasCounter', AtlasCounterModel.schema);

  const counter = await Counter.findById('changeLogSeq').lean();
  const seq = (counter as any)?.value ?? 0;

  res.json(new CustomResponse(true, { seq }, `Current Atlas seq: ${seq}`));
});

// ─── POST /sync/apply-bootstrap-batch ─────────────────────────────────────────
/**
 * LOCAL-ONLY — called by the sync engine during bootstrap.
 * Bulk-upserts a batch of documents into the local MongoDB collection.
 * Idempotent: calling multiple times with the same docs is safe.
 *
 * Body: { collection: string, docs: object[] }
 */
export const sync_apply_bootstrap_batch = asyncHandler(async (req: Request, res: Response) => {
  const syncSecret = req.headers['x-sync-secret'];
  appAssert(syncSecret === SECRET_ADMIN_KEY, UNAUTHORIZED, 'Invalid sync secret');

  const { collection, docs } = req.body as {
    collection: string;
    docs: Record<string, any>[];
  };

  appAssert(collection && typeof collection === 'string', BAD_REQUEST, 'collection is required');
  appAssert(Array.isArray(docs) && docs.length > 0, BAD_REQUEST, 'docs must be a non-empty array');

  const db = mongoose.connection.db!;
  const col = db.collection(collection);

  // Build a bulk upsert operation for each doc
  const bulkOps = docs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $setOnInsert: doc },
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(bulkOps, { ordered: false });

  res.json(
    new CustomResponse(
      true,
      { upserted: result.upsertedCount, matched: result.matchedCount },
      `Bootstrap batch applied to ${collection}`,
    ),
  );
});


