import { Category } from './category';
import { MongoEntity } from './mongoEntity';
import { Student } from './student';
import { User } from './user';

export type PaymentHistoryEntry = {
	amount: number;
	date: Date;
	modeOfPayment: 'cash' | 'gcash';
};

export type Transaction = MongoEntity & {
	amount: number;
	recordedBy?: User;
	date: Date;
	category: Category;
	owner: Student;
	description?: string;
	modeOfPayment: 'cash' | 'gcash';
	governor: string;
	treasurer: string;
	viceGovernor: string;
	auditor: string;
	details: { [key: string]: string };
	paymentHistory: PaymentHistoryEntry[];
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
	status?: boolean | string;
	startDate?: Date;
	endDate?: Date;
};
