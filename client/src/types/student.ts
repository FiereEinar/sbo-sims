import { MongoEntity } from './mongoEntity';
import { TransactionsData } from './transaction';

export type Student = MongoEntity & {
	firstname: string;
	lastname: string;
	studentID: string;
	middlename: string;
	gender: string;
	course: string;
	year: number;
	email?: string;
};

// TODO: rename this shit
export type StudentWithTransactions = Student & TransactionsData;
