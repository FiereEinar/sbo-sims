import { Category } from './category';
import { MongoEntity } from './mongoEntity';
import { Student } from './student';

export type Transaction = MongoEntity & {
	amount: number;
	date: Date;
	category: Category;
	owner: Student;
	description?: string;
	governor: string;
	treasurer: string;
	viceGovernor: string;
	auditor: string;
	details: { [key: string]: string };
	createdAt: Date;
	updatedAt: Date;
};

export type TransactionsData = {
	totalTransactions: number;
	totalTransactionsAmount: number;
};

export type TransactionPeriodFilter =
	| 'all'
	| 'today'
	| 'weekly'
	| 'monthly'
	| 'yearly';

export type TransactionsFilterValues = {
	search?: string;
	page?: number;
	pageSize?: number;
	course?: string;
	period?: TransactionPeriodFilter;
	category?: string;
	status?: boolean;
	startDate?: Date;
	endDate?: Date;
};
