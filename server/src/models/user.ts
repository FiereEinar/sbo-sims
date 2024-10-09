import mongoose from 'mongoose';
import { Entity } from '../types/entity';
import { Image } from '../types/image';

const Schema = mongoose.Schema;

export interface IUser extends Entity {
	_id: string;
	studentID: string;
	password: string;
	profile: Image;
	role: 'admin' | 'regular';
	bio: string;
	token: string;
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
	role: { type: String, enum: ['admin', 'regular'], default: 'regular' },
	bio: { type: String, default: '' },
	token: { type: String, default: '' },
});

export default mongoose.model('User', UserSchema);
