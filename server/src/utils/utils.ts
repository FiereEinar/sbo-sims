import {
	addDays,
	format,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from 'date-fns';
import { FilterQuery } from 'mongoose';
import { ITransaction } from '../models/transaction';
import os from 'os';
import { EJSTransaction } from '../types/transaction';
import _ from 'lodash';

export function validateEmail(email: string) {
	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	return emailPattern.test(email);
}

export const getDateFilterByPeriod = (
	period: string
): FilterQuery<ITransaction> | undefined => {
	const currentDate = new Date();

	if (period === 'today') {
		return {
			date: {
				$gte: startOfDay(currentDate).toISOString(),
				$lt: startOfDay(addDays(currentDate, 1)).toISOString(),
			},
		};
	} else if (period === 'weekly') {
		return {
			date: {
				$gte: startOfWeek(currentDate).toISOString(),
			},
		};
	} else if (period === 'monthly') {
		return {
			date: {
				$gte: startOfMonth(currentDate).toISOString(),
			},
		};
	} else if (period === 'yearly') {
		return {
			date: {
				$gte: startOfYear(currentDate).toISOString(),
			},
		};
	}
};

export const getPeriodLabel = (period: string): string | undefined => {
	switch (period) {
		case 'today':
			return 'Today';
		case 'weekly':
			return 'This Week';
		case 'monthly':
			return 'This Month';
		case 'yearly':
			return 'This Year';
	}
};

export const getIPv4Address = () => {
	const interfaces = os.networkInterfaces();
	let result = null;

	for (const name in interfaces) {
		if (!interfaces[name]) continue;
		for (const iface of interfaces[name]) {
			console.log(`${iface.family}: ${iface.address}`);
			if (iface.family === 'IPv4' && !iface.internal) {
				result = iface.address; // Return the first non-internal IPv4 address
			}
		}
	}
	return result ? result : 'localhost'; // Fallback to localhost if no IPv4 address is found
};

export const getEJSTransactionsData = (transactions: ITransaction[]) => {
	const EJSTransactions: EJSTransaction[] = [];
	let totalAmount = 0;

	transactions.forEach((transaction) => {
		const tDate = transaction.date
			? format(
					new Date(transaction.date.toISOString()) ?? undefined,
					'MM/dd/yyyy'
			  )
			: 'No date provided';

		const tStatus =
			transaction.amount >= transaction.category.fee ? 'Paid' : 'Partial';

		const t: EJSTransaction = {
			amount: transaction.amount.toString(),
			category: `${_.startCase(transaction.category.name)}`,
			organization: `${_.startCase(transaction.category.organization.name)}`,
			course: transaction.owner.course.toUpperCase(),
			date: tDate,
			fullname: _.startCase(
				`${transaction.owner.firstname} ${transaction.owner.middlename} ${transaction.owner.lastname}`
			),
			status: tStatus,
			studentID: transaction.owner.studentID,
			year: transaction.owner.year.toString(),
		};

		EJSTransactions.push(t);
		totalAmount += transaction.amount;
	});

	return {
		EJSTransactions,
		totalAmount,
	};
};
