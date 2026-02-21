import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IRole extends mongoose.Document {
	_id: mongoose.Types.ObjectId;
	name: string;
	description?: string;
	permissions: string[];
	createdBy: mongoose.Types.ObjectId; // admin who created the role
	createdAt: Date;
	updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			minlength: 1,
		},
		description: { type: String, maxlength: 200 },
		permissions: [String],
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{
		timestamps: true,
	},
);

export default RoleSchema;
