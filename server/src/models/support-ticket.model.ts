import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportTicket extends Document {
  title: string;
  description: string;
  type: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  organization: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  replies: {
    message: string;
    sender: mongoose.Types.ObjectId | any;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    replies: [
      {
        message: { type: String, required: true },
        sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);

export default SupportTicket;
