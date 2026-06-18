import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ISession extends mongoose.Document {
  userID: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}

export const SessionSchema = new Schema<ISession>({
  userID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  userAgent: { type: String },
  ip: { type: String },
});

// TTL index: MongoDB will automatically delete documents once expiresAt has passed
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel = mongoose.model('Session', SessionSchema);
export default SessionModel;
