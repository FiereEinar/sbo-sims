import mongoose from 'mongoose';
import { IOrganization } from './organization.model';

const Schema = mongoose.Schema;

export type YearLevel = 1 | 2 | 3 | 4;

export type Semester = '1st' | '2nd';

// export type CategoryType = 'transaction' | 'prelisting';

export interface ICategory extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  fee: number;
  organization: IOrganization;
  details: string[];
  semester: string;
  schoolYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    fee: { type: Number, required: true },
    details: { type: [String], required: true },
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

const CategoryModel = mongoose.model('Category', CategorySchema);
export default CategoryModel;
