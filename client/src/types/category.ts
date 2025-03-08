import { MongoEntity } from './mongoEntity';
import { Organization } from './organization';
import { TransactionsData } from './transaction';

export type Category = MongoEntity & {
	name: string;
	fee: number;
	organization: Organization;
	details: string[];
	createdAt: Date;
	updatedAt: Date;
};

// TODO: rename this shit
export type CategoryWithTransactions = Category & TransactionsData;
