import { Request } from 'express';
import { IUser } from '../models/user';
import { ITransaction } from '../models/transaction';

export interface CustomRequest extends Request {
	user?: IUser;
}

export type TransactionQueryFilterRequest = CustomRequest & {
	filteredTransactions?: ITransaction[];
};
