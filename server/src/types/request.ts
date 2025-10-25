import { Request } from 'express';
import { ITransaction } from '../models/transaction';
import { IPrelisting } from '../models/prelisting';

export type TransactionQueryFilterRequest = Request & {
	filteredTransactions?: ITransaction[];
	nextPage?: number;
	prevPage?: number;
	skipAmount?: number;
	pageSizeNum?: number;
};

export type PrelistingQueryFilterRequest = Request & {
	filteredPrelisting?: IPrelisting[];
	nextPage?: number;
	prevPage?: number;
	skipAmount?: number;
	pageSizeNum?: number;
};
