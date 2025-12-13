import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IOrganization extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	name: string;
	governor: string;
	viceGovernor: string;
	treasurer: string;
	auditor: string;
	departments: string[];
	createdAt: Date;
	updatedAt: Date;
}

export const OrganizationSchema = new Schema<IOrganization>(
	{
		name: { type: String, required: true },
		governor: { type: String, required: true },
		viceGovernor: { type: String, required: true },
		treasurer: { type: String, required: true },
		auditor: { type: String, required: true },
		departments: { type: [String] },
	},
	{ timestamps: true }
);
