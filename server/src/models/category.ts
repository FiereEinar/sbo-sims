import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface ICategory {
	_id: string;
	name: string;
	fee: number;
}

const CategorySchema = new Schema<ICategory>({
	name: { type: String, required: true },
	fee: { type: Number, required: true },
});

export default mongoose.model('Category', CategorySchema);
