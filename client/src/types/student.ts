import { MongoEntity } from './mongoEntity';

export type Student = MongoEntity & {
	firstname: string;
	lastname: string;
	studentID: string;
	email?: string;
};

// TODO: rename this shit
export type StudentWithTransactions = Student & {
	totalTransactions: number;
	totalTransactionsAmount: number;
};
