import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns';
dotenv.config();

const updateExistingUsers = async () => {
	try {
		dns.setServers(['8.8.8.8', '1.1.1.1']); // Uses Google and Cloudflare DNS
		await mongoose.connect(process.env.ME_CONFIG_MONGODB_URL as string);
		const db = mongoose.connection.useDb('transactionsdb');
		
		const result = await db.collection('users').updateMany(
			{ verified: { $exists: false } },
			{ $set: { verified: true } }
		);
		
		console.log(`Updated ${result.modifiedCount} existing users to verified: true`);
		process.exit(0);
	} catch (error) {
		console.error('Error updating users:', error);
		process.exit(1);
	}
};

updateExistingUsers();
