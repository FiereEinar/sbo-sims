import asyncHandler from 'express-async-handler';
import { FilterQuery } from 'mongoose';
import { ITransaction } from '../models/transaction';
import { addDays, startOfDay } from 'date-fns';
import { TransactionQueryFilterRequest } from '../types/request';
import CustomResponse from '../types/response';
import { getDateFilterByPeriod } from '../utils/utils';

export const transactionQueryFilter = asyncHandler(
	async (req: TransactionQueryFilterRequest, res, next) => {
		const {
			page,
			pageSize,
			search,
			course,
			startDate,
			endDate,
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

		if (startDate && endDate)
			filters.push({
				date: {
					$gte: new Date(startDate as string).toISOString(),
					$lte: addDays(new Date(endDate as string), 1).toISOString(),
				},
			});

		if (category) filters.push({ category: category });

		const transactions: ITransaction[] = await req.TransactionModel.find({
			$and: filters,
		})
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
			.exec();

		let filteredTransactions = transactions;

		if (search?.length) {
			filteredTransactions = filteredTransactions.filter((transaction) => {
				const fullname = `${transaction.owner.firstname} ${transaction.owner.middlename} ${transaction.owner.lastname}`;
				const s = search.toString().toLowerCase();

				return (
					fullname.toLowerCase().includes(s) ||
					transaction.owner.studentID.includes(s)
				);
			});
		}

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

		const filteredTransactionsLength = filteredTransactions.length;

		const nextPage =
			filteredTransactionsLength > skipAmount + pageSizeNum ? pageNum + 1 : -1;
		const prevPage = pageNum > 1 ? pageNum - 1 : -1;

		req.filteredTransactions = filteredTransactions;
		req.nextPage = nextPage;
		req.prevPage = prevPage;
		req.skipAmount = skipAmount;
		req.pageSizeNum = pageSizeNum;
		next();
	}
);
