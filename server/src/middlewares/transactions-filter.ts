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

		const hasSearch = search && search.length;

		const defaultPage = 1;
		const defaultPageSize = 100;

		const pageNum = hasSearch
			? defaultPage
			: page
				? parseInt(page as string)
				: defaultPage;
		const pageSizeNum = pageSize
			? parseInt(pageSize as string)
			: defaultPageSize;
		const skipAmount = (pageNum - 1 || 0) * pageSizeNum;

		const filters: FilterQuery<ITransaction>[] = [
			{
				organization: req.tenantContext!.organizationId,
				semester: req.tenantContext!.semester,
				schoolYear: req.tenantContext!.schoolYear,
			}
		];

		const periodFilter = getDateFilterByPeriod(period as string);
		if (periodFilter) filters.push(periodFilter);

		if (startDate && endDate)
			filters.push({
				date: {
					$gte: new Date(startDate as string).toISOString(),
					$lte: new Date(endDate as string).toISOString(),
				},
			});

		if (category) filters.push({ category: category });

		// 1. Resolve Student filters (search, course) first to avoid fetching everything
		if (hasSearch || course) {
			const studentFilters: any = {
				organization: req.tenantContext!.organizationId,
				semester: req.tenantContext!.semester,
				schoolYear: req.tenantContext!.schoolYear,
			};
			
			if (course) {
				studentFilters.course = course;
			}
			
			if (hasSearch) {
				const s = search.toString().toLowerCase();
				studentFilters.$or = [
					{ firstname: { $regex: s, $options: 'i' } },
					{ lastname: { $regex: s, $options: 'i' } },
					{ studentID: { $regex: s, $options: 'i' } },
				];
			}
			
			const matchingStudents = await req.StudentModel!.find(studentFilters).select('_id').lean().exec();
			
			if (matchingStudents.length === 0) {
				// No students matched the search/course, so no transactions will match.
				req.filteredTransactions = [];
				req.nextPage = -1;
				req.prevPage = -1;
				req.skipAmount = 0;
				req.pageSizeNum = pageSizeNum;
				return next();
			}
			
			const matchingStudentIds = matchingStudents.map(s => s._id);
			filters.push({ owner: { $in: matchingStudentIds } });
		}

		const queryConditions = filters.length > 0 ? { $and: filters } : {};

		// If a status filter is provided (e.g. on CategoryInfo), we must fallback to fetching all matching 
		// and doing in-memory filtering because status depends on populated category.fee
		if (status) {
			const transactions: ITransaction[] = await req.TransactionModel.find(queryConditions)
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
				.populate({
					model: req.UserModel,
					path: 'recordedBy',
				})
				.sort({ createdAt: sortByDate === 'asc' ? 1 : -1 })
				.exec();

			let filteredTransactions = transactions;
			
			const statusStr = String(status).toLowerCase();
			if (statusStr === 'true' || statusStr === 'paid') {
				filteredTransactions = filteredTransactions.filter(
					(transaction) => transaction.amount >= transaction.category.fee,
				);
			} else if (statusStr === 'false' || statusStr === 'partial') {
				filteredTransactions = filteredTransactions.filter(
					(transaction) => transaction.amount < transaction.category.fee,
				);
			} else if (statusStr === 'unpaid') {
				filteredTransactions = [];
			}

			const filteredTransactionsLength = filteredTransactions.length;
			const nextPage = filteredTransactionsLength > skipAmount + pageSizeNum ? pageNum + 1 : -1;
			const prevPage = pageNum > 1 ? pageNum - 1 : -1;

			req.filteredTransactions = filteredTransactions;
			req.nextPage = hasSearch ? -1 : nextPage;
			req.prevPage = hasSearch ? -1 : prevPage;
			req.skipAmount = skipAmount;
			req.pageSizeNum = pageSizeNum;
			return next();
		}

		// 2. Database-level pagination (Highly Optimized)
		const [transactions, totalTransactionsCount] = await Promise.all([
			req.TransactionModel.find(queryConditions)
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
				.populate({
					model: req.UserModel,
					path: 'recordedBy',
				})
				.sort({ createdAt: sortByDate === 'asc' ? 1 : -1 })
				.skip(skipAmount)
				.limit(pageSizeNum)
				.exec(),
			req.TransactionModel.countDocuments(queryConditions)
		]);

		const nextPage = totalTransactionsCount > skipAmount + pageSizeNum ? pageNum + 1 : -1;
		const prevPage = pageNum > 1 ? pageNum - 1 : -1;

		req.filteredTransactions = transactions;
		// For DB pagination, since we already sliced the array, we must tell the controller not to slice again.
		// By setting skipAmount=0 and filteredTransactions=transactions, the controller's splice will work correctly.
		req.skipAmount = 0; 
		req.pageSizeNum = pageSizeNum;
		req.nextPage = hasSearch ? -1 : nextPage;
		req.prevPage = hasSearch ? -1 : prevPage;

		next();
	},
);
