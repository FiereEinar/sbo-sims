import { Document } from 'mongoose';

export interface AppSetting {
	activeSchoolYear: string;
	activeSemester: string;
}

export interface AppSettingDocument extends AppSetting, Document {}
