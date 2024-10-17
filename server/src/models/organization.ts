import mongoose from 'mongoose';
import { ICategory } from './category';

const Schema = mongoose.Schema;

export interface IOrganization {
	_id: string;
	name: string;
	governor: string;
	treasurer: string;
	departments: string[];
}

const OrganizationSchema = new Schema<IOrganization>({
	name: { type: String, required: true },
	governor: { type: String, required: true },
	treasurer: { type: String, required: true },
	departments: { type: [String] },
});

export default mongoose.model('Organization', OrganizationSchema);
