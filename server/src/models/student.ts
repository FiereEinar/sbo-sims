import mongoose from 'mongoose';
import { ITransaction } from './transaction';

const Schema = mongoose.Schema;

export interface IStudent {
	_id: string;
	studentID: string;
	firstname: string;
	lastname: string;
	transactions: [ITransaction];
}

const StudentSchema = new Schema<IStudent>({
	studentID: { type: String, required: true },
	firstname: { type: String, required: true },
	lastname: { type: String, required: true },
	transactions: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
});

export default mongoose.model('Student', StudentSchema);
