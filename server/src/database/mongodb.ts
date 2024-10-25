import mongoose from 'mongoose';

const mongoDB = process.env.MONGO_URI;

export default async function connectToMongoDB(): Promise<void> {
	try {
		if (mongoDB === undefined) throw new Error('MONGO URI not found');
		await mongoose.connect(mongoDB);
	} catch (err: any) {
		console.error('Failed to connect to MongoDB', err);
	}
}
