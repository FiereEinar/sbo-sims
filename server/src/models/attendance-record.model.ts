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
      required: true,
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

const AttendanceRecordModel = mongoose.model(
  'AttendanceRecord',
  AttendanceRecordSchema,
);
export default AttendanceRecordModel;
