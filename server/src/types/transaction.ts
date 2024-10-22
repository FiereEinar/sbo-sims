export type createTransactionBody = {
	amount: number;
	studentID: string;
	categoryID: string;
	description?: string;
	date?: Date;
};

export type updateTransactionAmountBody = {
	amount: number;
};

export type TransactionPeriodFilter = 'all' | 'today' | 'weekly' | 'monthly';

// export type TransactionsFilterValues = {
// 	// search?: string;
// 	course?: string;
// 	period?: TransactionPeriodFilter;
// 	category?: string;
// 	status?: boolean;
// 	date?: Date;
// };
