import { NextFunction, Response } from 'express';
import { CustomRequest } from '../types/request';
import { getDatabaseConnection } from '../database/databaseManager';
import { DB_MODEL, originalDbName } from '../constants';
import { UserSchema } from '../models/user';
import { StudentSchema } from '../models/student';
import { CategorySchema } from '../models/category';
import { TransactionSchema } from '../models/transaction';
import { OrganizationSchema } from '../models/organization';
import { ME_CONFIG_MONGODB_URL } from '../constants/env';
import { SessionSchema } from '../models/session';

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

		const dynamicConnection = await getDatabaseConnection(
			dbName,
			ME_CONFIG_MONGODB_URL
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
		const originalConnection = await getDatabaseConnection(
			originalDbName,
			ME_CONFIG_MONGODB_URL
		);

		req.UserModel = originalConnection.model(DB_MODEL.USER, UserSchema);
		req.SessionModel = originalConnection.model(
			DB_MODEL.SESSION,
			SessionSchema
		);
		req.OrganizationModel = originalConnection.model(
			DB_MODEL.ORGANIZATION,
			OrganizationSchema
		);

		next();
	} catch (err: any) {
		console.error('Failed to attach original database models', err);
	}
};
