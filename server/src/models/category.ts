import mongoose from 'mongoose';
import { IOrganization } from './organization';

const Schema = mongoose.Schema;

export type YearLevel = 1 | 2 | 3 | 4;

export type Semester = '1st' | '2nd';

// export type CategoryType = 'transaction' | 'prelisting';

export interface ICategory extends mongoose.Document {
	_id: string;
	name: string;
	fee: number;
	organization: IOrganization;
	details: string[];
	// type: CategoryType;
	createdAt: Date;
	updatedAt: Date;
}

export const CategorySchema = new Schema<ICategory>(
	{
		name: { type: String, required: true },
		fee: { type: Number, required: true },
		details: { type: [String], required: true },
		// type: { type: String, enum: ['transaction', 'prelisting'], required: true },
		organization: {
			type: Schema.Types.ObjectId,
			ref: 'Organization',
			required: true,
		},
	},
	{ timestamps: true }
);
