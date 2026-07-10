import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export type EventSessionStatus = 'upcoming' | 'active' | 'completed' | 'paused';

export interface IEventSession extends mongoose.Document {
  organization: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  name: string;
  status: EventSessionStatus;
  startedAt: Date;
  endedAt: Date;
  pausedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const EventSessionSchema = new Schema<IEventSession>(
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
    name: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['upcoming', 'active', 'completed', 'paused'],
      default: 'upcoming',
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    pausedAt: { type: Date },
  },
  { timestamps: true },
);

EventSessionSchema.pre('findOneAndDelete', async function (next) {
  const query = this.getQuery();
  if (query._id) {
    // Delete all attendance records associated with this session
    await mongoose.model('AttendanceRecord').deleteMany({ session: query._id });
  }
  next();
});

const EventSessionModel = mongoose.model('EventSession', EventSessionSchema);
export default EventSessionModel;
