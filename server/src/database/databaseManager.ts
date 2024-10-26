import mongoose, { Connection } from 'mongoose';

const connections: { [key: string]: Connection } = {};

export const getDatabaseConnection = async (
	dbName: string,
	dbURI: string
): Promise<Connection> => {
	if (connections[dbName]) {
		return connections[dbName];
	}

	const newConnection = mongoose.createConnection(`${dbURI}/${dbName}`);

	connections[dbName] = newConnection;
	return newConnection;
};
