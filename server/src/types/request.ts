import { Request } from 'express';
import { IUser } from '../models/user';
import { ITransaction } from '../models/transaction';
import { Model } from 'mongoose';
import { ICategory } from '../models/category';
import { IOrganization } from '../models/organization';
import { IStudent } from '../models/student';

export interface CustomRequest extends Request {
	currentUser?: IUser;
	UserModel?: Model<IUser>;
	StudentModel?: Model<IStudent>;
	TransactionModel?: Model<ITransaction>;
	CategoryModel?: Model<ICategory>;
	OrganizationModel?: Model<IOrganization>;
}

export type TransactionQueryFilterRequest = CustomRequest & {
	filteredTransactions?: ITransaction[];
};
