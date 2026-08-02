import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IAttendanceRecord extends mongoose.Document {
  organization: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  session: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  studentIdInput: string;
  recordedBy?: mongoose.Types.ObjectId; // the user who scanned/recorded
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'EventSession',
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: false,
    },
    studentIdInput: { type: String, required: true },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    recordedAt: { type: Date, required: true, default: Date.now() },
  },
  { timestamps: true },
);

// Prevents duplicate attendance for the same student in the same session.
// We use a partial filter so that unmapped records (missing student) don't collide.
AttendanceRecordSchema.index(
  { session: 1, student: 1 },
  { unique: true, partialFilterExpression: { student: { $exists: true } } }
);

// Prevents duplicate attendance for the same scanned ID in the same session.
AttendanceRecordSchema.index({ session: 1, studentIdInput: 1 }, { unique: true });

// Speeds up the most common query pattern: fetch all records for a session in an org.
AttendanceRecordSchema.index({ organization: 1, session: 1 });

const AttendanceRecordModel = mongoose.model(
  'AttendanceRecord',
  AttendanceRecordSchema,
);

// Force sync indexes to apply the partialFilterExpression change
// This will drop the old index and build the new one.
AttendanceRecordModel.syncIndexes().then(() => {
  console.log('AttendanceRecord indexes synced successfully.');
}).catch(console.error);

export default AttendanceRecordModel;
