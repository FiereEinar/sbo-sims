import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'in_flight' | 'synced';

export type SyncableEntityType =
  | 'Transaction'
  | 'Student'
  | 'Category'
  | 'Event'
  | 'EventSession'
  | 'AttendanceRecord'
  | 'Prelisting'
  | 'Gpoa'
  | 'PaymentRequest'
  | 'Role'
  | 'User';

export interface IOperationLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  clientId: string;
  entityType: SyncableEntityType;
  entityId: mongoose.Types.ObjectId;
  operation: SyncOperation;
  /**
   * Field-level patch — only the changed fields, not the full document.
   * This allows field-level LWW: two users editing different fields on the
   * same document will both survive without conflict.
   */
  patch: Record<string, any>;
  organizationId: mongoose.Types.ObjectId;
  /** Client's local UTC timestamp — used for LWW conflict resolution */
  clientTimestamp: Date;
  status: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OperationLogSchema = new Schema<IOperationLog>(
  {
    clientId: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
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
    status: {
      type: String,
      enum: ['pending', 'in_flight', 'synced'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

// Primary index for the sync engine push query
OperationLogSchema.index({ status: 1, clientTimestamp: 1 });

const OperationLogModel = mongoose.model<IOperationLog>(
  'OperationLog',
  OperationLogSchema,
);

export default OperationLogModel;
