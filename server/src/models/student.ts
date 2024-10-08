import mongoose from 'mongoose';
import { ITransaction } from './transaction';
import { Entity } from '../types/entity';

const Schema = mongoose.Schema;

export interface IStudent extends Entity {
	_id: string;
	studentID: string;
}

const StudentSchema = new Schema<IStudent>({
	studentID: { type: String, required: true },
	firstname: { type: String, required: true },
	lastname: { type: String, required: true },
	email: { type: String, required: false },
});

export default mongoose.model('Student', StudentSchema);
