import { MongoEntity } from './mongoEntity';
import { Organization } from './organization';

export type Category = MongoEntity & {
	name: string;
	fee: number;
	organization: Organization;
};

// TODO: rename this shit
// export type CategoryWithTransactions = Category & TransactionsData;
