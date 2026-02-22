import mongoose from 'mongoose';
import { ICategory } from './category';
import { IStudent } from './student';
import { IUser } from './user';

const Schema = mongoose.Schema;

export interface ITransaction extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	owner: IStudent;
	amount: number;
	category: ICategory;
	description?: string;
	date?: Date;
	recordedBy?: IUser;
	governor: string;
	treasurer: string;
	viceGovernor: string;
	auditor: string;
	details: { [key: string]: string };
	createdAt: Date;
	updatedAt: Date;
}

export const TransactionSchema = new Schema<ITransaction>(
	{
		amount: { type: Number, minlength: 1, required: true },
		owner: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
		category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
		description: { type: String, required: false },
		date: { type: Date, default: Date.now },
		recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
		governor: { type: String, required: true },
		viceGovernor: { type: String, required: true },
		treasurer: { type: String, required: true },
		auditor: { type: String, required: true },
		details: { type: Schema.Types.Mixed, required: true },
	},
	{ timestamps: true },
);
