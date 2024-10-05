import mongoose from 'mongoose';
import { ICategory } from './category';

const Schema = mongoose.Schema;

export interface ITransaction {
	_id: string;
	amount: number;
	category: ICategory;
	description: string;
	date: Date;
}

const TransactionSchema = new Schema<ITransaction>({
	amount: { type: Number, minlength: 1, required: true },
	category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
	description: { type: String, required: false },
	date: { type: Date, default: Date.now },
});

export default mongoose.model('Transaction', TransactionSchema);
