import { ICategory } from '../models/category';

export interface ICategoryWithTransactions extends ICategory {
	totalTransactions: number;
	totalTransactionsAmount: number;
}
