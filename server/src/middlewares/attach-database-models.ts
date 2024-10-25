import { NextFunction, Response } from 'express';
import { CustomRequest } from '../types/request';
import { getDatabaseConnection } from '../database/databaseManager';
import { DB_MODEL, originalDbName } from '../constants';
import { UserSchema } from '../models/user';
import { StudentSchema } from '../models/student';
import { CategorySchema } from '../models/category';
import { TransactionSchema } from '../models/transaction';
import { OrganizationSchema } from '../models/organization';

export const attachDatabaseModels = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const currentUser = req.currentUser;
		if (!currentUser) {
			res.sendStatus(401);
			return;
		}

		const dbName = `${currentUser.activeSemDB}${currentUser.activeSchoolYearDB}`;
		const mongoURI = process.env.MONGO_URI;

		const dynamicConnection = await getDatabaseConnection(
			dbName,
			mongoURI as string
		);

		req.StudentModel = dynamicConnection.model(DB_MODEL.STUDENT, StudentSchema);
		req.CategoryModel = dynamicConnection.model(
			DB_MODEL.CATEGORY,
			CategorySchema
		);
		req.TransactionModel = dynamicConnection.model(
			DB_MODEL.TRANSACTION,
			TransactionSchema
		);

		next();
	} catch (err: any) {
		console.error('Failed to attach database models', err);
	}
};

export const attachOriginalDatabaseModels = async (
	req: CustomRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const mongoURI = process.env.MONGO_URI;
		const originalConnection = await getDatabaseConnection(
			originalDbName,
			mongoURI as string
		);

		req.UserModel = originalConnection.model(DB_MODEL.USER, UserSchema);
		req.OrganizationModel = originalConnection.model(
			DB_MODEL.ORGANIZATION,
			OrganizationSchema
		);

		next();
	} catch (err: any) {
		console.error('Failed to attach original database models', err);
	}
};
