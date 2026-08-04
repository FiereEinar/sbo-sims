import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ISyncCheckpoint extends mongoose.Document<string> {
  /** Always 'main' — singleton document per local DB */
  _id: string;
  /** This machine's permanent UUID */
  clientId: string;
  /**
   * clientTimestamp of the most recently successfully pushed OperationLog entry.
   * On next push, we query: status != 'synced' (catches in_flight and pending).
   */
  lastPushedAt: Date;
  /**
   * The Atlas AtlasChangeLog.seq number we last successfully pulled and applied.
   * On next pull, we request: seq > lastPulledSeq
   */
  lastPulledSeq: number;
  lastSyncAttemptAt?: Date;
  lastSyncSuccessAt?: Date;
  /** Detected clock skew in milliseconds (client - server). Updated each sync. */
  clockSkewMs?: number;
  /**
   * Timestamp of the completed one-time bootstrap (full Atlas → local dump).
   * If undefined, bootstrap has not run yet and will be triggered on next online sync.
   */
  bootstrappedAt?: Date;
}

const SyncCheckpointSchema = new Schema<ISyncCheckpoint>(
  {
    _id: { type: String },
    clientId: { type: String, required: true },
    lastPushedAt: { type: Date, default: new Date(0) },
    lastPulledSeq: { type: Number, default: 0 },
    lastSyncAttemptAt: { type: Date },
    lastSyncSuccessAt: { type: Date },
    clockSkewMs: { type: Number },
    bootstrappedAt: { type: Date },
  },
  { timestamps: false, _id: false },
);

const SyncCheckpointModel = mongoose.model<ISyncCheckpoint>(
  'SyncCheckpoint',
  SyncCheckpointSchema,
);

export default SyncCheckpointModel;
