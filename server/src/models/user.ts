import mongoose, { Document } from 'mongoose';
import { Entity } from '../types/entity';
import { Image } from '../types/image';
import { getYear } from 'date-fns';
const Schema = mongoose.Schema;

export interface IUser extends Entity {
	_id: string;
	studentID: string;
	password: string;
	profile: Image;
	role: 'admin' | 'regular';
	bio: string;
	token: string;
	activeSchoolYearDB: string;
	activeSemDB: '1' | '2';
}

export const UserSchema = new Schema<IUser>({
	studentID: { type: String, required: true },
	firstname: { type: String, minlength: 1, maxlength: 50, required: true },
	lastname: { type: String, minlength: 1, maxlength: 50, required: true },
	email: { type: String, required: false },
	password: { type: String, required: true },
	profile: {
		url: String,
		publicID: String,
	},
	role: { type: String, enum: ['admin', 'regular'], default: 'regular' },
	bio: { type: String, default: '' },
	token: { type: String, default: '' },
	activeSchoolYearDB: { type: String, default: getYear(new Date()).toString() },
	activeSemDB: { type: String, enum: ['1', '2'], default: '1' },
});

// export default mongoose.model('User', UserSchema);
