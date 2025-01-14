import { Request } from 'express';
import { ITransaction } from '../models/transaction';

export type TransactionQueryFilterRequest = Request & {
	filteredTransactions?: ITransaction[];
	nextPage?: number;
	prevPage?: number;
	skipAmount?: number;
	pageSizeNum?: number;
};
