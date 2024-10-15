import mongoose from 'mongoose';
import { IOrganization } from './organization';

const Schema = mongoose.Schema;

export interface ICategory {
	_id: string;
	name: string;
	fee: number;
	organization: IOrganization;
}

const CategorySchema = new Schema<ICategory>({
	name: { type: String, required: true },
	fee: { type: Number, required: true },
	organization: {
		type: Schema.Types.ObjectId,
		ref: 'Organization',
		required: true,
	},
});

export default mongoose.model('Category', CategorySchema);
