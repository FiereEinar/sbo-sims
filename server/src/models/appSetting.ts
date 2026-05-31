import mongoose, { Document } from 'mongoose';

export interface IAppSetting extends Document {
	_id: mongoose.Types.ObjectId;
	activeSchoolYear: string;
	activeSemester: string;
	healthcheckMessage?: string;
}

const AppSettingSchema = new mongoose.Schema<IAppSetting>(
	{
		activeSchoolYear: { type: String, required: true },
		activeSemester: { type: String, required: true },
		healthcheckMessage: { type: String, required: false },
	},
	{ timestamps: true }
);

export { AppSettingSchema };