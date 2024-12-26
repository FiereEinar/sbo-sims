import mongoose from 'mongoose';
import { ME_CONFIG_MONGODB_URL } from '../constants/env';

export default async function connectToMongoDB(): Promise<void> {
	try {
		await mongoose.connect(ME_CONFIG_MONGODB_URL);
	} catch (err: any) {
		console.error('Failed to connect to MongoDB', err);
	}
}
