import mongoose from 'mongoose';
import type { SyncOperation, SyncableEntityType } from './operation-log.model';

const Schema = mongoose.Schema;

export interface IAtlasChangeLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  /**
   * Monotonically increasing global sequence number, managed by AtlasCounter.
   * Clients use this as a cursor: "give me everything with seq > lastPulledSeq"
   */
  seq: number;
  /** The Electron clientId of the machine that originated this change */
  clientId: string;
  entityType: SyncableEntityType;
  entityId: mongoose.Types.ObjectId;
  operation: SyncOperation;
  /** Field-level patch — same format as OperationLog.patch */
  patch: Record<string, any>;
  organizationId: mongoose.Types.ObjectId;
  /** Client's local time — the LWW decision key */
  clientTimestamp: Date;
  /** Time Atlas received and applied this change */
  serverTimestamp: Date;
}

export interface IAtlasCounter extends mongoose.Document<string> {
  _id: string;
  value: number;
}

const AtlasChangeLogSchema = new Schema<IAtlasChangeLog>(
  {
    seq: { type: Number, required: true, unique: true, index: true },
    clientId: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    operation: {
      type: String,
      enum: ['create', 'update', 'delete'],
      required: true,
    },
    patch: { type: Schema.Types.Mixed, required: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    clientTimestamp: { type: Date, required: true },
    serverTimestamp: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false },
);

// Primary pull query index
AtlasChangeLogSchema.index({ seq: 1, clientId: 1, organizationId: 1 });

export const AtlasChangeLogModel = mongoose.model<IAtlasChangeLog>(
  'AtlasChangeLog',
  AtlasChangeLogSchema,
);

/**
 * Single-document counter for the global seq number.
 * Incremented atomically via findOneAndUpdate with $inc.
 */
const AtlasCounterSchema = new Schema<IAtlasCounter>(
  {
    _id: { type: String },
    value: { type: Number, default: 0 },
  },
  { _id: false },
);

export const AtlasCounterModel = mongoose.model<IAtlasCounter>(
  'AtlasCounter',
  AtlasCounterSchema,
);
