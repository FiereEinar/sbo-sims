import { ICategory } from '../models/category';

export interface ICategoryWithTransactions extends ICategory {
	totalTransactions: number;
	totalTransactionsAmount: number;
}

export type updateCategoryBody = {
	name: string;
	fee: number;
	organizationID: string;
	details: string[];
};

export type createCategoryBody = {
	name: string;
	fee: number;
	organizationID: string;
	details: string[];
};
