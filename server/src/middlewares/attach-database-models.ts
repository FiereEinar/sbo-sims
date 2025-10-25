import { NextFunction, Request, Response } from 'express';
import { getDatabaseConnection } from '../database/databaseManager';
import { DB_MODEL, originalDbName } from '../constants';
import { UserSchema } from '../models/user';
import { StudentSchema } from '../models/student';
import { CategorySchema } from '../models/category';
import { TransactionSchema } from '../models/transaction';
import { OrganizationSchema } from '../models/organization';
import { SessionSchema } from '../models/session';
import { PrelistingSchema } from '../models/prelisting';

export const attachDatabaseModels = async (
	req: Request,
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
			process.env.ME_CONFIG_MONGODB_URL as string
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
		req.PrelistingModel = dynamicConnection.model(
			DB_MODEL.PRELISTING,
			PrelistingSchema
		);

		next();
	} catch (err: any) {
		console.error('Failed to attach database models', err);
	}
};

export const attachOriginalDatabaseModels = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const originalConnection = await getDatabaseConnection(
			originalDbName,
			process.env.ME_CONFIG_MONGODB_URL as string
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
