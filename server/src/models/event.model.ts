import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IEvent extends mongoose.Document {
  title: string;
  description: string;
  type: string;
  venue: string;
  start: Date;
  end: Date;
  organization: mongoose.Types.ObjectId;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    venue: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const EventModel = mongoose.model('Event', EventSchema);
export default EventModel;
