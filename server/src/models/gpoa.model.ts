import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IGpoa extends mongoose.Document {
  name: string;
  description?: string;
  targetDate: Date;
  venue: string;
  budget: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organization: mongoose.Types.ObjectId;
  semester: string;
  schoolYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export const GpoaSchema = new Schema<IGpoa>(
  {
    name: { type: String, required: true },
    description: { type: String },
    targetDate: { type: Date, required: true },
    venue: { type: String, required: true },
    budget: { type: Number, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    semester: { type: String, enum: ['1', '2'], required: true },
    schoolYear: { type: String, required: true },
  },
  { timestamps: true },
);

const GpoaModel = mongoose.model('Gpoa', GpoaSchema);
export default GpoaModel;
