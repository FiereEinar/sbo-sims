import asyncHandler from 'express-async-handler';
import { FilterQuery } from 'mongoose';
import { ITransaction } from '../models/transaction';
import {
	addDays,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from 'date-fns';
import { TransactionQueryFilterRequest } from '../types/request';
import CustomResponse from '../types/response';
import { getDateFilterByPeriod } from '../utils/utils';

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
		if (!req.TransactionModel) {
			res
				.status(500)
				.json(new CustomResponse(false, null, 'TransactionModel not attached'));

			return;
		}

		const defaultPage = 1;
		const defaultPageSize = 100;

		const isPaid = JSON.parse((status as string) ?? 'false');
		const pageNum = page ? parseInt(page as string) : defaultPage;
		const pageSizeNum = pageSize
			? parseInt(pageSize as string)
			: defaultPageSize;
		const skipAmount = (pageNum - 1 || 0) * pageSizeNum;

		const filters: FilterQuery<ITransaction>[] = [];

		const periodFilter = getDateFilterByPeriod(period as string);
		if (periodFilter) filters.push(periodFilter);

		if (date)
			filters.push({
				date: {
					$gte: startOfDay(new Date(date as string)).toISOString(),
					$lt: startOfDay(addDays(new Date(date as string), 1)).toISOString(),
				},
			});
		if (category) filters.push({ category: category });

		const transactions = await req.TransactionModel.find({ $and: filters })
			.populate({
				model: req.CategoryModel,
				path: 'category',
				populate: {
					model: req.OrganizationModel,
					path: 'organization',
				},
			})
			.populate({
				model: req.StudentModel,
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

		filteredTransactions = filteredTransactions.splice(skipAmount, pageSizeNum);

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
