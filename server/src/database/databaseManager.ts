import mongoose, { Connection } from 'mongoose';
import { MONGODB_PARAMS } from '../constants/env';

const connections: { [key: string]: Connection } = {};

export const getDatabaseConnection = async (
	dbName: string,
	dbURI: string
): Promise<Connection> => {
	if (connections[dbName]) {
		return connections[dbName];
	}

	// Remove trailing slash
	if (dbURI[dbURI.length - 1] === '/') {
		dbURI = dbURI.slice(0, -1);
	}

	const newConnection = mongoose.createConnection(
		`${dbURI}/${dbName}${MONGODB_PARAMS}`
	);

	connections[dbName] = newConnection;
	return newConnection;
};
