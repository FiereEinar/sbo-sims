import mongoose from 'mongoose';
import { IOrganization } from './organization';
import { IStudent } from './student';
import { ICategory } from './category';

const Schema = mongoose.Schema;

export interface IPrelisting extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	owner: IStudent;
	category: ICategory;
	description?: string;
	date?: Date;
	details: { [key: string]: string };
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
	},
	{ timestamps: true }
);
