import mongoose from 'mongoose';
import { ICategory } from './category';
import { IStudent } from './student';

const Schema = mongoose.Schema;

export interface ITransaction extends mongoose.Document {
	_id: string;
	owner: IStudent;
	amount: number;
	category: ICategory;
	description?: string;
	date?: Date;
	governor: string;
	treasurer: string;
	viceGovernor: string;
	auditor: string;
}

export const TransactionSchema = new Schema<ITransaction>({
	amount: { type: Number, minlength: 1, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
	category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
	description: { type: String, required: false },
	date: { type: Date, default: Date.now },
	governor: { type: String, required: true },
	viceGovernor: { type: String, required: true },
	treasurer: { type: String, required: true },
	auditor: { type: String, required: true },
});
