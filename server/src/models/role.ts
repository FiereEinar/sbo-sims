import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IRole extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	name: string;
	description?: string;
	permissions: string[];
	isDefault: boolean;
	createdBy: mongoose.Types.ObjectId; // admin who created the role
	organization: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
	{
		name: {
			type: String,
			required: true,
			minlength: 1,
		},
		description: { type: String, maxlength: 200 },
		permissions: [String],
		isDefault: { type: Boolean, default: false },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
	},
	{
		timestamps: true,
	},
);

RoleSchema.index({ name: 1, organization: 1 }, { unique: true });

export default RoleSchema;
