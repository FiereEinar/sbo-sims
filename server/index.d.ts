import { Request } from 'express';
import { IUser } from '../models/user';
import { ITransaction } from '../models/transaction';
import { Model } from 'mongoose';
import { ICategory } from '../models/category';
import { IOrganization } from '../models/organization';
import { IStudent } from '../models/student';
import { ISession } from '../models/session';
import { IPrelisting } from './src/models/prelisting';
import { IRole } from './src/models/role';

declare global {
	namespace Express {
		interface Request {
			currentUser: IUser;
			UserModel: Model<IUser>;
			StudentModel: Model<IStudent>;
			TransactionModel: Model<ITransaction>;
			PrelistingModel: Model<IPrelisting>;
			CategoryModel: Model<ICategory>;
			OrganizationModel: Model<IOrganization>;
			SessionModel: Model<ISession>;
			RoleModel: Model<IRole>;
		}
	}
}
