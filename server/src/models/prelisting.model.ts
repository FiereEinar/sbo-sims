import mongoose from 'mongoose';
import { IStudent } from './student.model';
import { ICategory } from './category.model';

const Schema = mongoose.Schema;

export interface IPrelisting extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  owner: IStudent;
  category: ICategory;
  description?: string;
  date?: Date;
  details: { [key: string]: string };
  semester: string;
  schoolYear: string;
  organization: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PrelistingSchema = new Schema<IPrelisting>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, required: false },
    date: { type: Date, default: Date.now },
    details: { type: Schema.Types.Mixed, required: true },
    semester: { type: String, enum: ['1', '2'], required: true },
    schoolYear: { type: String, required: true },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
  },
  { timestamps: true },
);

const PrelistingModel = mongoose.model('Prelisting', PrelistingSchema);
export default PrelistingModel;
