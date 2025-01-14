import { Request } from 'express';
import { IUser } from '../models/user';
import { ITransaction } from '../models/transaction';
import { Model } from 'mongoose';
import { ICategory } from '../models/category';
import { IOrganization } from '../models/organization';
import { IStudent } from '../models/student';
import { ISession } from '../models/session';

declare global {
	namespace Express {
		interface Request {
			currentUser: IUser;
			UserModel: Model<IUser>;
			StudentModel: Model<IStudent>;
			TransactionModel: Model<ITransaction>;
			CategoryModel: Model<ICategory>;
			OrganizationModel: Model<IOrganization>;
			SessionModel: Model<ISession>;
		}
	}
}
