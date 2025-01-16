import mongoose from 'mongoose';
import { Image } from '../types/image';
import { getYear } from 'date-fns';
const Schema = mongoose.Schema;

// REMINDER: update the schema below if you want to add/remove roles
export type UserRoles = 'governor' | 'treasurer' | 'auditor' | 'regular';

export interface IUser extends mongoose.Document {
	_id: string;
	studentID: string;
	firstname: string;
	lastname: string;
	email: string;
	password: string;
	profile: Image;
	role: UserRoles;
	bio: string;
	token: string;
	activeSchoolYearDB: string;
	activeSemDB: '1' | '2';
	omitPassword: () => Omit<IUser, 'password'>;
}

const UserSchema = new Schema<IUser>({
	studentID: { type: String, required: true },
	firstname: { type: String, minlength: 1, maxlength: 50, required: true },
	lastname: { type: String, minlength: 1, maxlength: 50, required: true },
	email: { type: String, required: false },
	password: { type: String, required: true },
	profile: {
		url: String,
		publicID: String,
	},
	role: {
		type: String,
		enum: ['governor', 'treasurer', 'auditor', 'regular'],
		default: 'regular',
	},
	bio: { type: String, default: '' },
	token: { type: String, default: '' },
	activeSchoolYearDB: { type: String, default: getYear(new Date()).toString() },
	activeSemDB: { type: String, enum: ['1', '2'], default: '1' },
});

UserSchema.methods.omitPassword = function () {
	const user = this.toObject();
	delete user.password;
	return user;
};

export { UserSchema };
