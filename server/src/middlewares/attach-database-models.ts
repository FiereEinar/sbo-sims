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
import RoleSchema from '../models/role';
import { AppSettingSchema } from '../models/appSetting';

export const extractTenantContext = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const currentUser = req.currentUser;
		if (!currentUser) {
			res.sendStatus(401);
			return;
		}

		const activeSem = (req.headers['x-active-sem'] as string) || currentUser.activeSemDB;
		const activeSchoolYear = (req.headers['x-active-school-year'] as string) || currentUser.activeSchoolYearDB;
		const orgSlug = req.headers['x-organization-slug'] as string;

		if (!orgSlug) {
			return res.status(400).json({ message: 'x-organization-slug header is required' });
		}

		const organization = await req.OrganizationModel.findOne({ slug: orgSlug });
		if (!organization) {
			return res.status(404).json({ message: 'Organization not found' });
		}

		req.tenantContext = {
			organizationId: organization._id,
			semester: activeSem,
			schoolYear: activeSchoolYear
		};

		next();
	} catch (err: any) {
		console.error('Failed to extract tenant context', err);
		res.status(500).json({ message: 'Internal server error extracting tenant context' });
	}
};

export const attachOriginalDatabaseModels = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const originalConnection = await getDatabaseConnection(
			originalDbName,
			process.env.ME_CONFIG_MONGODB_URL as string,
		);

		req.UserModel = originalConnection.model(DB_MODEL.USER, UserSchema);
		req.SessionModel = originalConnection.model(
			DB_MODEL.SESSION,
			SessionSchema,
		);
		req.OrganizationModel = originalConnection.model(
			DB_MODEL.ORGANIZATION,
			OrganizationSchema,
		);
		req.RoleModel = originalConnection.model(DB_MODEL.ROLE, RoleSchema);

		req.AppSettingModel = originalConnection.model(DB_MODEL.APPSETTING, AppSettingSchema);
		
		// Term models
		req.StudentModel = originalConnection.model(DB_MODEL.STUDENT, StudentSchema);
		req.CategoryModel = originalConnection.model(DB_MODEL.CATEGORY, CategorySchema);
		req.TransactionModel = originalConnection.model(DB_MODEL.TRANSACTION, TransactionSchema);
		req.PrelistingModel = originalConnection.model(DB_MODEL.PRELISTING, PrelistingSchema);
		
		next();
	} catch (err: any) {
		console.error('Failed to attach original database models', err);
	}
};
