import mongoose from 'mongoose';
import { ICategory } from './category';
import { IStudent } from './student';

const Schema = mongoose.Schema;

export interface ITransaction {
	_id: string;
	owner: IStudent;
	amount: number;
	category: ICategory;
	description?: string;
	date?: Date;
	governor: string;
	treasurer: string;
}

const TransactionSchema = new Schema<ITransaction>({
	amount: { type: Number, minlength: 1, required: true },
	owner: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
	category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
	description: { type: String, required: false },
	date: { type: Date, default: Date.now },
	governor: { type: String, required: true },
	treasurer: { type: String, required: true },
});

export default mongoose.model('Transaction', TransactionSchema);
