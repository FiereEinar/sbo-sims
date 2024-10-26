import { startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { FilterQuery } from 'mongoose';
import { ITransaction } from '../models/transaction';

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
