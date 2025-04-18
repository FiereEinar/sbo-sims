export type createTransactionBody = {
	amount: number;
	studentID: string;
	categoryID: string;
	description?: string;
	date?: Date;
	details: { [key: string]: any };
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

export type EJSTransaction = {
	studentID: string;
	fullname: string;
	course: string;
	year: string;
	date: string;
	organization: string;
	category: string;
	status: string;
	amount: string;
};

export type TransactionEJSVariables = {
	period: string;
	startDate: string;
	endDate: string;
	totalAmount: number;
	transactions: EJSTransaction[];
};
