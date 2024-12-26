import {
	addDays,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from 'date-fns';
import { FilterQuery } from 'mongoose';
import { ITransaction } from '../models/transaction';
import os from 'os';

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
