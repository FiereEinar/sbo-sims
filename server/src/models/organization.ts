import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IOrganization {
	_id: string;
	name: string;
}

const OrganizationSchema = new Schema<IOrganization>({
	name: { type: String, required: true },
});

export default mongoose.model('Organization', OrganizationSchema);
