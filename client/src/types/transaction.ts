import { Category } from './category';
import { MongoEntity } from './mongoEntity';
import { Student } from './student';

export type Transaction = MongoEntity & {
	amount: number;
	date: Date;
	category: Category;
	owner: Student;
	description?: string;
};

export type TransactionsData = {
	totalTransactions: number;
	totalTransactionsAmount: number;
};
