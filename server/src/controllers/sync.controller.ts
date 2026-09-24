import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getAtlasConnection } from '../database/atlas-connection';
import {
  AtlasChangeLogModel,
  AtlasCounterModel,
  IAtlasChangeLog,
} from '../models/atlas-change-log.model';
import {
  IOperationLog,
  SyncableEntityType,
} from '../models/operation-log.model';
import CustomResponse from '../types/response';
import appAssert from '../errors/appAssert';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
} from '../constants/http';

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

// ─── Patch sanitizer ─────────────────────────────────────────────────────────
/**
 * Flattens populated Mongoose ref objects in a patch to just their _id.
 * e.g. { rbacRole: { _id: "abc", name: "Admin" } } → { rbacRole: "abc" }
 *
 * This is needed because the logOperation middleware may capture req.body
 * or body.data with populated refs, and Mongoose will reject an object
 * when it expects an ObjectId ref.
 */
function sanitizePatch(patch: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof mongoose.Types.ObjectId) &&
      '_id' in value &&
      // Only flatten if it looks like a populated ref (has fields beyond just _id)
      Object.keys(value).length > 1
    ) {
      clean[key] = value._id;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// ─── GET /sync/health ─────────────────────────────────────────────────────────
/**
 * Simple liveness check for the Electron sync engine.
 * Returns 200 with the server's current UTC time (used for clock-skew detection).
 */
export const sync_health = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json({ ok: true, serverTime: new Date().toISOString() });
  },
);

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
  const ChangeLog =
    atlasConn.models['AtlasChangeLog'] ||
    atlasConn.model<IAtlasChangeLog>(
      'AtlasChangeLog',
      AtlasChangeLogModel.schema,
    );
  const Counter =
    atlasConn.models['AtlasCounter'] ||
    atlasConn.model('AtlasCounter', AtlasCounterModel.schema);

  let accepted = 0;
  let skipped = 0;
  const serverTimestamp = new Date();

  // 1. Bulk check idempotency: find ops that already exist in AtlasChangeLog in 1 query
  const opIds = ops.map((o) => o._id);
  const existingLogs = await ChangeLog.find(
    { _id: { $in: opIds } },
    { _id: 1 },
  ).lean();
  const existingIdsSet = new Set(
    existingLogs.map((l: any) => (l._id ? l._id.toString() : '')),
  );

  const pendingOps = ops.filter((op) => {
    if (existingIdsSet.has(op._id.toString())) {
      skipped++;
      return false;
    }
    const modelName = op.entityType as SyncableEntityType;
    if (!ENTITY_COLLECTION_MAP[modelName]) {
      skipped++;
      return false;
    }
    return true;
  });

  if (pendingOps.length === 0) {
    res.json(new CustomResponse(true, { accepted: 0, skipped }, 'Push complete'));
    return;
  }

  // 2. Reserve range of sequence numbers for all new ops in this batch
  const counter = await Counter.findOneAndUpdate(
    { _id: 'changeLogSeq' },
    { $inc: { value: pendingOps.length } },
    { upsert: true, new: true },
  );

  let currentSeq = counter!.value - pendingOps.length + 1;
  const changeLogsToInsert: any[] = [];

  for (const op of pendingOps) {
    const modelName = op.entityType as SyncableEntityType;
    let AtlasModel: mongoose.Model<any>;
    if (atlasConn.models[modelName]) {
      AtlasModel = atlasConn.models[modelName];
    } else {
      const localModel = mongoose.models[modelName];
      if (!localModel) {
        skipped++;
        continue;
      }
      AtlasModel = atlasConn.model(modelName, localModel.schema);
    }

    const entityObjectId = new mongoose.Types.ObjectId(op.entityId);

    if (op.operation === 'create') {
      const insertPatch = sanitizePatch({ ...op.patch });
      delete insertPatch._id;

      await AtlasModel.updateOne(
        { _id: entityObjectId },
        { $setOnInsert: insertPatch },
        { upsert: true, timestamps: false },
      );
    } else if (op.operation === 'update') {
      const existing = await AtlasModel.findOne(
        { _id: entityObjectId },
        { updatedAt: 1 },
        { lean: true },
      );

      const existingUpdatedAt = (existing as any)?.updatedAt
        ? new Date((existing as any).updatedAt)
        : new Date(0);
      const incomingTs = new Date(op.clientTimestamp);

      if (incomingTs > existingUpdatedAt) {
        const sanitized = sanitizePatch(op.patch);
        const updatePatch: Record<string, any> = {};
        for (const [key, value] of Object.entries(sanitized)) {
          if (key === '_id') continue;
          updatePatch[key] = value;
        }
        updatePatch.updatedAt = serverTimestamp;
        await AtlasModel.updateOne(
          { _id: entityObjectId },
          { $set: updatePatch },
          { timestamps: false },
        );
      }
    } else if (op.operation === 'delete') {
      const existing = await AtlasModel.findOne(
        { _id: entityObjectId },
        { archived: 1 },
        { lean: true },
      );
      if (existing !== null) {
        if ('archived' in existing) {
          await AtlasModel.updateOne(
            { _id: entityObjectId },
            { $set: { archived: true, updatedAt: serverTimestamp } },
            { timestamps: false },
          );
        } else {
          await AtlasModel.deleteOne({ _id: entityObjectId });
        }
      }
    }

    changeLogsToInsert.push({
      _id: op._id,
      seq: currentSeq++,
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

  if (changeLogsToInsert.length > 0) {
    await ChangeLog.insertMany(changeLogsToInsert, { ordered: false }).catch(
      (err) => {
        // Ignore duplicate key errors if already present
        if (err.code !== 11000) throw err;
      },
    );
  }

  res.json(new CustomResponse(true, { accepted, skipped }, 'Push complete'));
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
  const ChangeLog =
    atlasConn.models['AtlasChangeLog'] ||
    atlasConn.model<IAtlasChangeLog>(
      'AtlasChangeLog',
      AtlasChangeLogModel.schema,
    );

  const filter: Record<string, any> = {
    seq: { $gt: since },
    organizationId: new mongoose.Types.ObjectId(organizationId),
  };

  if (excludeClient) {
    filter.clientId = { $ne: excludeClient };
  }

  const changes = await ChangeLog.find(filter)
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
import { getClientId } from '../middlewares/operation-log.middleware';

// ─── GET /sync/pending-ops ────────────────────────────────────────────────────
/**
 * Returns a batch of pending or in_flight OperationLog entries.
 * The sync engine fetches these, marks them in_flight, then pushes to Atlas.
 */
export const sync_get_pending_ops = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);

    const ops = await OperationLogModel.find({
      status: { $in: ['pending', 'in_flight'] },
    })
      .sort({ clientTimestamp: 1 })
      .limit(limit)
      .lean();

    res.json(new CustomResponse(true, { ops }, `${ops.length} pending ops`));
  },
);

// ─── PATCH /sync/mark-in-flight ───────────────────────────────────────────────
/**
 * Marks a batch of OperationLog entries as in_flight before the push attempt.
 */
export const sync_mark_in_flight = asyncHandler(
  async (req: Request, res: Response) => {
    const { opIds } = req.body as { opIds: string[] };
    appAssert(Array.isArray(opIds), BAD_REQUEST, 'opIds must be an array');

    await OperationLogModel.updateMany(
      { _id: { $in: opIds } },
      { $set: { status: 'in_flight' } },
    );

    res.json(new CustomResponse(true, null, 'Marked in_flight'));
  },
);

// ─── PATCH /sync/mark-synced ──────────────────────────────────────────────────
/**
 * Marks a batch of OperationLog entries as synced after Atlas confirms receipt.
 */
export const sync_mark_synced = asyncHandler(
  async (req: Request, res: Response) => {
    const { opIds } = req.body as { opIds: string[] };
    appAssert(Array.isArray(opIds), BAD_REQUEST, 'opIds must be an array');

    await OperationLogModel.updateMany(
      { _id: { $in: opIds } },
      { $set: { status: 'synced' } },
    );

    res.json(new CustomResponse(true, null, 'Marked synced'));
  },
);

// ─── GET /sync/checkpoint ─────────────────────────────────────────────────────
/**
 * Returns the local SyncCheckpoint document (singleton).
 */
export const sync_get_checkpoint = asyncHandler(
  async (_req: Request, res: Response) => {
    const checkpoint = await SyncCheckpointModel.findById('main').lean();
    res.json(
      new CustomResponse(
        true,
        checkpoint ?? { lastPulledSeq: 0 },
        'Checkpoint',
      ),
    );
  },
);

// ─── PATCH /sync/checkpoint ───────────────────────────────────────────────────
/**
 * Updates fields on the SyncCheckpoint singleton.
 * The sync engine calls this to advance lastPulledSeq after each applied change.
 */
export const sync_update_checkpoint = asyncHandler(
  async (req: Request, res: Response) => {
    const allowed = [
      'lastPulledSeq',
      'lastPushedAt',
      'lastSyncAttemptAt',
      'lastSyncSuccessAt',
      'clockSkewMs',
      'bootstrappedAt',
    ];
    const update: Record<string, any> = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    const checkpoint = await SyncCheckpointModel.findByIdAndUpdate(
      'main',
      { $set: update, $setOnInsert: { clientId: getClientId() } },
      { upsert: true, new: true },
    ).lean();

    res.json(new CustomResponse(true, checkpoint, 'Checkpoint updated'));
  },
);

// ─── POST /sync/apply-change ──────────────────────────────────────────────────
/**
 * Applies a single AtlasChangeLog entry to the local MongoDB.
 * Called during the pull phase for each received change.
 * Uses the same LWW logic as the Atlas push handler, but in reverse.
 */
export const sync_apply_change = asyncHandler(
  async (req: Request, res: Response) => {
    const change = req.body.change as IAtlasChangeLog;
    appAssert(
      change && change.entityType && change.entityId,
      BAD_REQUEST,
      'change is required',
    );

    const modelName = change.entityType as SyncableEntityType;
    const LocalModel = mongoose.models[modelName];
    appAssert(LocalModel, BAD_REQUEST, `Local model ${modelName} not found`);

    const entityId = new mongoose.Types.ObjectId(change.entityId);

    if (change.operation === 'create') {
      const cleanPatch = sanitizePatch(change.patch);
      delete cleanPatch._id;
      const castPatch = castDocumentTypes(cleanPatch);
      await LocalModel.updateOne(
        { _id: entityId },
        { $setOnInsert: { _id: entityId, ...castPatch } },
        { upsert: true, timestamps: false },
      );
    } else if (change.operation === 'update') {
      const existing = await LocalModel.findOne(
        { _id: entityId },
        { updatedAt: 1 },
        { lean: true },
      );
      const existingUpdatedAt = (existing as any)?.updatedAt
        ? new Date((existing as any).updatedAt)
        : new Date(0);
      const incomingTs = new Date(change.clientTimestamp);

      if (incomingTs > existingUpdatedAt) {
        const sanitized = sanitizePatch(change.patch);
        const updatePatch: Record<string, any> = {};
        for (const [key, value] of Object.entries(sanitized)) {
          if (key === '_id') continue;
          updatePatch[key] = value;
        }
        updatePatch.updatedAt = new Date();
        const castPatch = castDocumentTypes(updatePatch);
        await LocalModel.updateOne(
          { _id: entityId },
          { $set: castPatch },
          { timestamps: false },
        );
      }
    } else if (change.operation === 'delete') {
      const existing = await LocalModel.findOne(
        { _id: entityId },
        { archived: 1 },
        { lean: true },
      );
      if (existing !== null) {
        if ('archived' in existing) {
          await LocalModel.updateOne(
            { _id: entityId },
            { $set: { archived: true } },
            { timestamps: false },
          );
        } else {
          await LocalModel.deleteOne({ _id: entityId });
        }
      }
    }

    res.json(new CustomResponse(true, null, 'Change applied'));
  },
);

/**
 * POST /sync/apply-changes-batch
 * LOCAL-ONLY — applies a batch of pulled AtlasChangeLog entries to local MongoDB
 * and advances the checkpoint in a single operation.
 */
export const sync_apply_changes_batch = asyncHandler(
  async (req: Request, res: Response) => {
    const { changes } = req.body as { changes: IAtlasChangeLog[] };
    appAssert(
      Array.isArray(changes) && changes.length > 0,
      BAD_REQUEST,
      'changes must be a non-empty array',
    );

    let appliedCount = 0;
    let maxSeq = 0;

    for (const change of changes) {
      if (!change.entityType || !change.entityId) continue;
      const modelName = change.entityType as SyncableEntityType;
      const LocalModel = mongoose.models[modelName];
      if (!LocalModel) continue;

      const entityId = new mongoose.Types.ObjectId(change.entityId);

      if (change.operation === 'create') {
        const cleanPatch = sanitizePatch(change.patch);
        delete cleanPatch._id;
        const castPatch = castDocumentTypes(cleanPatch);
        await LocalModel.updateOne(
          { _id: entityId },
          { $setOnInsert: { _id: entityId, ...castPatch } },
          { upsert: true, timestamps: false },
        );
      } else if (change.operation === 'update') {
        const existing = await LocalModel.findOne(
          { _id: entityId },
          { updatedAt: 1 },
          { lean: true },
        );
        const existingUpdatedAt = (existing as any)?.updatedAt
          ? new Date((existing as any).updatedAt)
          : new Date(0);
        const incomingTs = new Date(change.clientTimestamp);

        if (incomingTs > existingUpdatedAt) {
          const sanitized = sanitizePatch(change.patch);
          const updatePatch: Record<string, any> = {};
          for (const [key, value] of Object.entries(sanitized)) {
            if (key === '_id') continue;
            updatePatch[key] = value;
          }
          updatePatch.updatedAt = new Date();
          const castPatch = castDocumentTypes(updatePatch);
          await LocalModel.updateOne(
            { _id: entityId },
            { $set: castPatch },
            { timestamps: false },
          );
        }
      } else if (change.operation === 'delete') {
        const existing = await LocalModel.findOne(
          { _id: entityId },
          { archived: 1 },
          { lean: true },
        );
        if (existing !== null) {
          if ('archived' in existing) {
            await LocalModel.updateOne(
              { _id: entityId },
              { $set: { archived: true } },
              { timestamps: false },
            );
          } else {
            await LocalModel.deleteOne({ _id: entityId });
          }
        }
      }

      if (change.seq > maxSeq) {
        maxSeq = change.seq;
      }
      appliedCount++;
    }

    if (maxSeq > 0) {
      await SyncCheckpointModel.findByIdAndUpdate(
        'main',
        {
          $set: { lastPulledSeq: maxSeq },
          $setOnInsert: { clientId: getClientId() },
        },
        { upsert: true, new: true },
      );
    }

    res.json(
      new CustomResponse(true, { appliedCount, maxSeq }, 'Batch applied'),
    );
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// BOOTSTRAP endpoints — first-run full data seeding from Atlas → local DB
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * All syncable collections and their organization filter field.
 * Every collection in this system has an `organization` field, so the
 * filter is uniform. We define the page size here too.
 */
const BOOTSTRAP_COLLECTIONS = [
  'organizations', // fetched without org filter (small, global)
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

type BootstrapCollection = (typeof BOOTSTRAP_COLLECTIONS)[number];

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
export const sync_bootstrap = asyncHandler(
  async (req: Request, res: Response) => {
    const collection = req.query.collection as BootstrapCollection;
    const orgId = req.query.orgId as string;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(
      Number(req.query.limit ?? BOOTSTRAP_PAGE_SIZE),
      BOOTSTRAP_PAGE_SIZE,
    );

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
  },
);

// ─── GET /sync/user-bootstrap ─────────────────────────────────────────────────
/**
 * Fetches a specific user, their organization, and their role from Atlas.
 * Used during the Cloud Proxy Login flow to bootstrap the offline session.
 * Query params: studentID
 */
export const sync_user_bootstrap = asyncHandler(
  async (req: Request, res: Response) => {
    const studentID = req.query.studentID as string;
    const userRole = req.query.userRole as string;
    const organizationId = req.query.organizationId as string | undefined;
    appAssert(studentID, BAD_REQUEST, 'studentID is required');

    const atlasConn = await getAtlasConnection();

    const User =
      atlasConn.models['User'] ||
      atlasConn.model(
        'User',
        (await import('../models/user.model')).default.schema,
      );
    const Organization =
      atlasConn.models['Organization'] ||
      atlasConn.model(
        'Organization',
        (await import('../models/organization.model')).default.schema,
      );
    const Role =
      atlasConn.models['Role'] ||
      atlasConn.model(
        'Role',
        (await import('../models/role.model')).default.schema,
      );

    const AppSetting =
      atlasConn.models['AppSetting'] ||
      atlasConn.model(
        'AppSetting',
        (await import('../models/app-setting.model')).default.schema,
      );

    const userQuery: any = {
      studentID,
      role: userRole,
    };
    if (organizationId) {
      userQuery.organization = organizationId;
    }

    const user = (await User.findOne(userQuery).lean()) as any;
    appAssert(user, NOT_FOUND, 'User not found in Atlas');

    const [organization, role, appSetting] = await Promise.all([
      user.organization
        ? Organization.findById(user.organization).lean()
        : null,
      user.rbacRole ? Role.findById(user.rbacRole).lean() : null,
      AppSetting.findOne().lean(),
    ]);

    res.json(
      new CustomResponse(
        true,
        { user, organization, role, appSetting },
        'User bootstrap data',
      ),
    );
  },
);

// ─── GET /sync/current-seq ────────────────────────────────────────────────────
/**
 * Returns the current Atlas global sequence counter value.
 * The sync engine calls this at the end of bootstrap to set lastPulledSeq
 * to "now", so the first incremental pull only gets changes AFTER the dump.
 */
export const sync_current_seq = asyncHandler(
  async (_req: Request, res: Response) => {
    const atlasConn = await getAtlasConnection();
    const Counter =
      atlasConn.models['AtlasCounter'] ||
      atlasConn.model('AtlasCounter', AtlasCounterModel.schema);

    const counter = await Counter.findById('changeLogSeq').lean();
    const seq = (counter as any)?.value ?? 0;

    res.json(new CustomResponse(true, { seq }, `Current Atlas seq: ${seq}`));
  },
);

// Helper function to recursively cast strings into BSON ObjectIds and Dates
function castDocumentTypes(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const isoDateRegex =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;
      if (isoDateRegex.test(obj)) {
        const parsedDate = new Date(obj);
        if (!isNaN(parsedDate.getTime())) return parsedDate;
      }
    }
    return obj;
  }

  // Preserve existing Date or ObjectId instances without transforming into empty objects
  if (obj instanceof Date || obj instanceof mongoose.Types.ObjectId) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => castDocumentTypes(item));
  }

  const transformed: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date || value instanceof mongoose.Types.ObjectId) {
      transformed[key] = value;
    } else if (
      (key === '_id' ||
        key.endsWith('Id') ||
        key === 'organization' ||
        key === 'user' ||
        key === 'session' ||
        key === 'transaction' ||
        key === 'student' ||
        key === 'event' ||
        key === 'category' ||
        key === 'owner' ||
        key === 'rbacRole') &&
      typeof value === 'string' &&
      mongoose.Types.ObjectId.isValid(value)
    ) {
      transformed[key] = new mongoose.Types.ObjectId(value);
    } else if (
      (key.includes('At') || key.includes('Date')) &&
      typeof value === 'string' &&
      !isNaN(Date.parse(value))
    ) {
      transformed[key] = new Date(value);
    } else {
      transformed[key] = castDocumentTypes(value);
    }
  }

  return transformed;
}

// ─── POST /sync/apply-bootstrap-batch ─────────────────────────────────────────
/**
 * LOCAL-ONLY — called by the sync engine during bootstrap.
 * Bulk-upserts a batch of documents into the local MongoDB collection.
 * Idempotent: calling multiple times with the same docs is safe.
 *
 * Body: { collection: string, docs: object[] }
 */
export const sync_apply_bootstrap_batch = asyncHandler(
  async (req: Request, res: Response) => {
    const { collection, docs } = req.body as {
      collection: string;
      docs: Record<string, any>[];
    };

    appAssert(
      collection && typeof collection === 'string',
      BAD_REQUEST,
      'collection is required',
    );
    appAssert(
      Array.isArray(docs) && docs.length > 0,
      BAD_REQUEST,
      'docs must be a non-empty array',
    );

    const db = mongoose.connection.db!;
    const col = db.collection(collection);

    // Build a bulk upsert operation for each doc
    const bulkOps = docs.map((doc) => {
      const cleanDoc = castDocumentTypes(doc);
      const { _id, ...rest } = cleanDoc;

      return {
        updateOne: {
          filter: { _id: cleanDoc._id },
          update: { $set: rest },
          upsert: true,
        },
      };
    });

    const result = await col.bulkWrite(bulkOps, { ordered: false });

    res.json(
      new CustomResponse(
        true,
        { upserted: result.upsertedCount, matched: result.matchedCount },
        `Bootstrap batch applied to ${collection}`,
      ),
    );
  },
);
// ─── FORCE SYNC HELPER ────────────────────────────────────────────────────────
interface ModuleFilterParams {
  moduleName: string;
  organizationId: mongoose.Types.ObjectId;
  semester?: string;
  schoolYear?: string;
  eventId?: string;
  sessionId?: string;
  db: mongoose.mongo.Db;
}

async function buildModuleFilter(params: ModuleFilterParams): Promise<any> {
  const {
    moduleName,
    organizationId,
    semester,
    schoolYear,
    eventId,
    sessionId,
    db,
  } = params;
  let filter: any = { organization: organizationId };

  if (
    [
      'Student',
      'Transaction',
      'Category',
      'Prelisting',
      'Gpoa',
      'PaymentRequest',
      'Event',
    ].includes(moduleName)
  ) {
    if (semester) filter.semester = semester;
    if (schoolYear) filter.schoolYear = schoolYear;
    if (moduleName === 'Event') {
      filter.archived = { $ne: true };
    }
  } else if (moduleName === 'EventSession') {
    if (eventId) {
      filter.event = new mongoose.Types.ObjectId(eventId);
    } else if (semester && schoolYear) {
      const events = await db
        .collection('events')
        .find(
          {
            organization: organizationId,
            semester,
            schoolYear,
            archived: { $ne: true },
          },
          { projection: { _id: 1 } },
        )
        .toArray();
      const eventIds = events.map((e) => e._id);
      const eventIdStrings = eventIds.map((id) => id.toString());
      filter.event = { $in: [...eventIds, ...eventIdStrings] };
    }
  } else if (moduleName === 'AttendanceRecord') {
    if (sessionId) {
      filter.session = new mongoose.Types.ObjectId(sessionId);
    } else if (eventId) {
      filter.event = new mongoose.Types.ObjectId(eventId);
    } else if (semester && schoolYear) {
      const events = await db
        .collection('events')
        .find(
          {
            organization: organizationId,
            semester,
            schoolYear,
            archived: { $ne: true },
          },
          { projection: { _id: 1 } },
        )
        .toArray();
      const eventIds = events.map((e) => e._id);
      const eventIdStrings = eventIds.map((id) => id.toString());
      filter.event = { $in: [...eventIds, ...eventIdStrings] };
    }
  }

  return filter;
}

// ─── FORCE SYNC ENDPOINTS ─────────────────────────────────────────────────────

export const sync_export_force_sync_data = asyncHandler(
  async (req: Request, res: Response) => {
    const { modules, semester, schoolYear: reqSchoolYear } = req.body as {
      modules: string[];
      semester?: string;
      schoolYear?: string;
    };
    const schoolYear = reqSchoolYear ? reqSchoolYear.split('-')[0] : undefined;

    appAssert(
      Array.isArray(modules) && modules.length > 0,
      BAD_REQUEST,
      'modules must be a non-empty array',
    );

    const organizationId = new mongoose.Types.ObjectId(
      req.currentUser!.organization as any,
    );
    const db = mongoose.connection.db!;
    const results: Record<string, any[]> = {};

    console.log(`[DEBUG]: organizationId: ${organizationId}`);
    console.log(`[DEBUG]: modules: ${JSON.stringify(modules)}`);
    console.log(`[DEBUG]: semester: ${semester}`);
    console.log(`[DEBUG]: schoolYear: ${schoolYear}`);

    // Determine event IDs if any child module is requested
    let eventIds: mongoose.Types.ObjectId[] = [];
    if (
      modules.includes('EventSession') ||
      modules.includes('AttendanceRecord')
    ) {
      const events = await db
        .collection('events')
        .find(
          { organization: organizationId, semester, schoolYear },
          { projection: { _id: 1 } },
        )
        .toArray();
      eventIds = events.map((e) => e._id);
    }

    for (const modelName of modules) {
      const collection = ENTITY_COLLECTION_MAP[modelName as SyncableEntityType];
      if (!collection) continue;

      let filter: any = { organization: organizationId };

      if (
        [
          'Student',
          'Transaction',
          'Category',
          'Prelisting',
          'Gpoa',
          'PaymentRequest',
          'Event',
        ].includes(modelName)
      ) {
        if (semester) filter.semester = semester;
        if (schoolYear) filter.schoolYear = schoolYear;
      } else if (
        modelName === 'EventSession' ||
        modelName === 'AttendanceRecord'
      ) {
        if (eventIds.length === 0) {
          results[collection] = [];
          continue;
        }
        const eventIdStrings = eventIds.map((id) => id.toString());
        filter = { event: { $in: [...eventIds, ...eventIdStrings] } };
      }

      const docs = await db.collection(collection).find(filter).toArray();
      results[collection] = docs;
    }

    res.json(
      new CustomResponse(true, { data: results }, 'Force sync data exported'),
    );
  },
);

export const sync_atlas_export_force_sync_data = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      modules,
      semester,
      schoolYear: reqSchoolYear,
      organizationId: orgIdStr,
    } = req.body as {
      modules: string[];
      semester?: string;
      schoolYear?: string;
      organizationId?: string;
    };
    const schoolYear = reqSchoolYear ? reqSchoolYear.split('-')[0] : undefined;

    appAssert(
      Array.isArray(modules) && modules.length > 0,
      BAD_REQUEST,
      'modules must be a non-empty array',
    );
    appAssert(orgIdStr, BAD_REQUEST, 'organizationId is required');

    const organizationId = new mongoose.Types.ObjectId(orgIdStr);
    const db = mongoose.connection.db!;
    const results: Record<string, any[]> = {};

    let eventIds: mongoose.Types.ObjectId[] = [];
    if (
      modules.includes('EventSession') ||
      modules.includes('AttendanceRecord')
    ) {
      const events = await db
        .collection('events')
        .find(
          { organization: organizationId, semester, schoolYear },
          { projection: { _id: 1 } },
        )
        .toArray();
      eventIds = events.map((e) => e._id);
    }

    for (const modelName of modules) {
      const collection = ENTITY_COLLECTION_MAP[modelName as SyncableEntityType];
      if (!collection) continue;

      let filter: any = { organization: organizationId };

      if (
        [
          'Student',
          'Transaction',
          'Category',
          'Prelisting',
          'Gpoa',
          'PaymentRequest',
          'Event',
        ].includes(modelName)
      ) {
        if (semester) filter.semester = semester;
        if (schoolYear) filter.schoolYear = schoolYear;
      } else if (
        modelName === 'EventSession' ||
        modelName === 'AttendanceRecord'
      ) {
        if (eventIds.length === 0) {
          results[collection] = [];
          continue;
        }
        const eventIdStrings = eventIds.map((id) => id.toString());
        filter = { event: { $in: [...eventIds, ...eventIdStrings] } };
      }

      const docs = await db.collection(collection).find(filter).toArray();
      results[collection] = docs;
    }

    res.json(
      new CustomResponse(
        true,
        { data: results },
        'Atlas force sync data exported',
      ),
    );
  },
);

export const sync_module_count_check = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      module,
      semester,
      schoolYear: reqSchoolYear,
      eventId,
      sessionId,
    } = req.body as {
      module: string;
      semester?: string;
      schoolYear?: string;
      eventId?: string;
      sessionId?: string;
    };
    appAssert(module, BAD_REQUEST, 'module is required');

    const organizationId = new mongoose.Types.ObjectId(
      req.currentUser!.organization as any,
    );
    const schoolYear = reqSchoolYear ? reqSchoolYear.split('-')[0] : undefined;
    const collection = ENTITY_COLLECTION_MAP[module as SyncableEntityType];
    appAssert(collection, BAD_REQUEST, `Invalid module: ${module}`);

    const localDb = mongoose.connection.db!;
    const filter = await buildModuleFilter({
      moduleName: module,
      organizationId,
      semester,
      schoolYear,
      eventId,
      sessionId,
      db: localDb,
    });

    const localCount = await localDb
      .collection(collection)
      .countDocuments(filter);

    let atlasCount: number | null = null;
    let isOnline = false;

    try {
      const atlasConn = await getAtlasConnection();
      if (atlasConn && atlasConn.readyState === 1 && atlasConn.db) {
        atlasCount = await atlasConn.db
          .collection(collection)
          .countDocuments(filter);
        isOnline = true;
      }
    } catch (err: any) {
      console.warn(
        `[SyncCheck] Cannot reach Atlas directly for ${module}: ${err.message}`,
      );
    }

    res.json(
      new CustomResponse(
        true,
        {
          localCount,
          atlasCount,
          isOnline,
          module,
        },
        'Module count check complete',
      ),
    );
  },
);

export const sync_apply_force_push = asyncHandler(
  async (req: Request, res: Response) => {
    const { data } = req.body as { data: Record<string, any[]> };
    appAssert(
      data && typeof data === 'object',
      BAD_REQUEST,
      'data object is required',
    );

    const atlasConn = await getAtlasConnection();
    const ChangeLog =
      atlasConn.models['AtlasChangeLog'] ||
      atlasConn.model<IAtlasChangeLog>(
        'AtlasChangeLog',
        AtlasChangeLogModel.schema,
      );
    const Counter =
      atlasConn.models['AtlasCounter'] ||
      atlasConn.model('AtlasCounter', AtlasCounterModel.schema);

    const serverTimestamp = new Date();
    const clientId = 'force-push';
    let totalUpserted = 0;

    for (const [collection, docs] of Object.entries(data)) {
      if (!Array.isArray(docs) || docs.length === 0) continue;

      const modelName = Object.keys(ENTITY_COLLECTION_MAP).find(
        (key) =>
          ENTITY_COLLECTION_MAP[key as SyncableEntityType] === collection,
      ) as SyncableEntityType;

      if (!modelName) continue;

      let AtlasModel = atlasConn.models[modelName];
      if (!AtlasModel) {
        const localModel = mongoose.models[modelName];
        if (localModel) {
          AtlasModel = atlasConn.model(modelName, localModel.schema);
        } else {
          continue;
        }
      }

      // Reserve range of sequence numbers for all docs in this batch
      const batchSize = docs.length;
      const counter = await Counter.findOneAndUpdate(
        { _id: 'changeLogSeq' },
        { $inc: { value: batchSize } },
        { upsert: true, new: true },
      );

      let currentSeq = counter!.value - batchSize + 1;

      const atlasBulkOps: any[] = [];
      const changeLogBulkOps: any[] = [];

      for (const doc of docs) {
        const entityId = new mongoose.Types.ObjectId(doc._id);
        const cleanDoc = castDocumentTypes(doc);
        delete cleanDoc._id;

        atlasBulkOps.push({
          updateOne: {
            filter: { _id: entityId },
            update: { $set: { ...cleanDoc, updatedAt: serverTimestamp } },
            upsert: true,
            timestamps: false,
          },
        });

        changeLogBulkOps.push({
          updateOne: {
            filter: { entityId, operation: 'create', clientId },
            update: {
              $setOnInsert: {
                seq: currentSeq++,
                clientId,
                entityType: modelName,
                entityId,
                operation: 'create' as const,
                patch: cleanDoc,
                organizationId: doc.organization
                  ? new mongoose.Types.ObjectId(doc.organization)
                  : undefined,
                clientTimestamp: cleanDoc.createdAt
                  ? new Date(cleanDoc.createdAt)
                  : serverTimestamp,
                serverTimestamp,
              },
            },
            upsert: true,
          },
        });
      }

      if (atlasBulkOps.length > 0) {
        await AtlasModel.bulkWrite(atlasBulkOps, { ordered: false });
        await ChangeLog.bulkWrite(changeLogBulkOps, { ordered: false });
        totalUpserted += atlasBulkOps.length;
      }
    }

    res.json(
      new CustomResponse(
        true,
        { totalUpserted },
        `Force push complete — ${totalUpserted} ops`,
      ),
    );
  },
);
