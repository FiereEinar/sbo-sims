import mongoose from 'mongoose';

const mongoDB = process.env.MONGO_URI;

export async function main(): Promise<void> {
	if (mongoDB === undefined) throw new Error('MONGO URI not found');
	await mongoose.connect(mongoDB);
}

export default () => main().catch((err) => console.log(err));
