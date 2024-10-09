import { MongoEntity } from './mongoEntity';
import { TransactionsData } from './transaction';

export type Category = MongoEntity & {
	name: string;
	fee: number;
};

// TODO: rename this shit
export type CategoryWithTransactions = Category & TransactionsData;
