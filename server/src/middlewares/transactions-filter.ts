import asyncHandler from 'express-async-handler';
import { FilterQuery } from 'mongoose';
import Transaction, { ITransaction } from '../models/transaction';
import Category from '../models/category';
import Student from '../models/student';
import Organization from '../models/organization';
import {
	addDays,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from 'date-fns';
import { TransactionQueryFilterRequest } from '../types/request';

/**
 * GET - fetch all transactions made
 * TODO: implement paganation
 *
 * can't directly implement pagination and filtering at the same time
 * I commented it for the mean time
 *
 * some values that are used in filtering needs to be populated first before they can used as filters
 * so all datas needs to be fetched from db first, which defeats the purpose of pagination
 */
export const transactionQueryFilter = asyncHandler(
	async (req: TransactionQueryFilterRequest, res, next) => {
		const {
			page,
			pageSize,
			search,
			course,
			date,
			sortByDate,
			category,
			status,
			period,
		} = req.query;

		// const defaultPage = 1;
		// const defaultPageSize = 100;

		const isPaid = JSON.parse((status as string) ?? 'false');
		// const pageNum = page ? parseInt(page as string) : defaultPage;
		// const pageSizeNum = pageSize ? parseInt(pageSize as string) : defaultPageSize;
		// const skipAmount = (pageNum - 1 || 0) * pageSizeNum;

		const filters: FilterQuery<ITransaction>[] = [];

		const currentDate = new Date();

		if (period === 'today') {
			filters.push({
				date: {
					$gte: startOfDay(currentDate).toISOString(),
				},
			});
		} else if (period === 'weekly') {
			filters.push({
				date: {
					$gte: startOfWeek(currentDate).toISOString(),
				},
			});
		} else if (period === 'monthly') {
			filters.push({
				date: {
					$gte: startOfMonth(currentDate).toISOString(),
				},
			});
		} else if (period === 'yearly') {
			filters.push({
				date: {
					$gte: startOfYear(currentDate).toISOString(),
				},
			});
		}

		if (date)
			filters.push({
				date: {
					$gte: startOfDay(new Date(date as string)).toISOString(),
					$lt: startOfDay(addDays(new Date(date as string), 1)).toISOString(),
				},
			});
		if (category) filters.push({ category: category });
		// is it possible to put the sort by period here? or do i have to put it after fetching all transactions?

		const transactions = await Transaction.find({ $and: filters })
			.populate({
				model: Category,
				path: 'category',
				populate: {
					model: Organization,
					path: 'organization',
				},
			})
			.populate({
				model: Student,
				path: 'owner',
			})
			.sort({ date: sortByDate === 'asc' ? 1 : -1 })
			// .skip(skipAmount)
			// .limit(pageSizeNum)
			.exec();

		let filteredTransactions = transactions;

		if (course) {
			filteredTransactions = filteredTransactions.filter(
				(transaction) => transaction.owner.course === course
			);
		}

		if (status) {
			if (isPaid) {
				filteredTransactions = filteredTransactions.filter(
					(transaction) => transaction.amount >= transaction.category.fee
				);
			} else {
				filteredTransactions = filteredTransactions.filter(
					(transaction) => transaction.amount < transaction.category.fee
				);
			}
		}

		// if (search) {
		// 	const searchRegex = new RegExp(search as string, 'i');
		// 	filteredTransactions = filteredTransactions.filter((transaction) =>
		// 		searchRegex.test(transaction.owner.studentID)
		// 	);
		// }

		// const next =
		// 	(await Transaction.countDocuments({ $and: filters })) >
		// 	skipAmount + pageSizeNum
		// 		? pageNum + 1
		// 		: -1;
		// const prev = pageNum > 1 ? pageNum - 1 : -1;

		req.filteredTransactions = filteredTransactions;
		next();
	}
);
