import asyncHandler from 'express-async-handler';
import Transaction, { ITransaction } from '../models/transaction';
import Category from '../models/category';
import Student from '../models/student';
import {
	createTransactionBody,
	updateTransactionAmountBody,
} from '../types/transaction';
import { validationResult } from 'express-validator';
import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { CustomRequest } from '../types/request';
import Organization from '../models/organization';
import { subDays, subWeeks, subMonths, subYears } from 'date-fns';

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
export const get_all_transactions = asyncHandler(async (req, res) => {
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
				$gte: subDays(currentDate, 1).toISOString(),
			},
		});
	} else if (period === 'weekly') {
		filters.push({
			date: {
				$gte: subWeeks(currentDate, 1).toISOString(),
			},
		});
	} else if (period === 'monthly') {
		filters.push({
			date: {
				$gte: subMonths(currentDate, 1).toISOString(),
			},
		});
	} else if (period === 'yearly') {
		filters.push({
			date: {
				$gte: subYears(currentDate, 1).toISOString(),
			},
		});
	}

	if (date) filters.push({ date: date });
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

	res.json(
		new CustomPaginatedResponse(
			true,
			filteredTransactions,
			'All transactions',
			// REMINDER: put next & prev here
			-1,
			-1
		)
	);
});

/**
 * GET - get a specific transaction based on ID from params
 */
export const get_transaction = asyncHandler(async (req, res) => {
	const { transactionID } = req.params;

	if (!mongoose.isValidObjectId(transactionID)) {
		res.json(
			new CustomResponse(false, null, `${transactionID} is not a valid ID`)
		);
		return;
	}

	const transaction = await Transaction.findById(transactionID)
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
		});

	if (transaction === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Transaction with ID: ${transactionID} not found`
			)
		);
		return;
	}

	res.json(new CustomResponse(true, transaction, 'Transaction'));
});

/**
 * POST - create and save a transaction
 */
export const create_transaction = asyncHandler(async (req, res) => {
	const {
		amount,
		categoryID,
		date,
		description,
		studentID,
	}: createTransactionBody = req.body;

	// check if the given category ID is valid
	if (!mongoose.isValidObjectId(categoryID)) {
		res.json(
			new CustomResponse(
				false,
				null,
				`${categoryID} is not a valid category ID`
			)
		);
		return;
	}

	// check if the category exists
	const category = await Category.findById(categoryID).populate({
		model: Organization,
		path: 'organization',
	});
	if (category === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Category with ID ${categoryID} not found`
			)
		);
		return;
	}

	// check if the amount paid is over the amount required for a category
	if (amount > category.fee) {
		res.json(
			new CustomResponse(
				false,
				null,
				`The amount is over the required amount for ${category.name} fee. Fee is ${category.fee}`
			)
		);
		return;
	}

	// check if the amount paid is non-negative
	if (amount <= 0) {
		res.json(new CustomResponse(false, null, `Enter a valid amount`));
		return;
	}

	// check for errors in validation
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in body validation',
				errors.array()[0].msg
			)
		);
		return;
	}

	// check if the student with the given ID exists
	const student = await Student.findOne({ studentID: studentID }).exec();
	if (student === null) {
		res.json(
			new CustomResponse(false, null, `Student with ID: ${studentID} not found`)
		);
		return;
	}

	// check if the student already paid
	const isAlreadyPaid = await Transaction.findOne({
		owner: student._id,
		category: category._id,
	}).exec();
	if (isAlreadyPaid) {
		res.json(new CustomResponse(false, null, 'This student has already paid'));
		return;
	}

	// check if the student is within the organization
	if (!category.organization.departments.includes(student.course)) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`
			)
		);
		return;
	}

	// create and save the transaction
	const transaction = new Transaction({
		amount: amount,
		category: categoryID,
		owner: student._id,
		description: description,
		date: date?.toISOString(),
		governor: category.organization.governor,
		treasurer: category.organization.treasurer,
	});
	await transaction.save();

	res.json(
		new CustomResponse(true, transaction, 'Transaction saved successfully')
	);
});

/**
 * DELETE - delete a transaction by given ID in params
 */
export const delete_transaction = asyncHandler(async (req, res) => {
	const { transactionID } = req.params;

	// check if the given ID is valid
	if (!mongoose.isValidObjectId(transactionID)) {
		res.json(
			new CustomResponse(
				false,
				null,
				`${transactionID} is not a valid transaction ID`
			)
		);
		return;
	}

	const result = await Transaction.findByIdAndDelete(transactionID);
	if (result === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Transaction with ID: ${transactionID} does not exists`
			)
		);
		return;
	}

	res.json(
		new CustomResponse(true, result, 'Transaction deleted successfully')
	);
});

/**
 * PUT - update a transaction based on ID in params
 */
export const update_transaction = asyncHandler(async (req, res) => {
	const { transactionID } = req.params;
	const {
		amount,
		categoryID,
		date,
		description,
		studentID,
	}: createTransactionBody = req.body;

	// check if the given transaction ID is valid
	if (!mongoose.isValidObjectId(transactionID)) {
		res.json(
			new CustomResponse(
				false,
				null,
				`${transactionID} is not a valid transaction ID`
			)
		);
		return;
	}

	// check if the category exists
	const category = await Category.findById(categoryID);
	if (category === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Category with ID ${categoryID} not found`
			)
		);
		return;
	}

	// check if the amount paid is over the amount required for a category
	if (amount > category.fee) {
		res.json(
			new CustomResponse(
				false,
				null,
				`The amount is over the required amount for ${category.name} fee (${category.fee})`
			)
		);
		return;
	}

	// check if the amount paid is non-negative
	if (amount <= 0) {
		res.json(new CustomResponse(false, null, `Enter a valid amount`));
		return;
	}

	// check for errors in validation
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in body validation',
				errors.array()[0].msg
			)
		);
		return;
	}

	// check if the student with the given ID exists
	const student = await Student.findOne({ studentID: studentID }).exec();
	if (student === null) {
		res.json(
			new CustomResponse(false, null, `Student with ID: ${studentID} not found`)
		);
		return;
	}

	// create and save the transaction
	const update: UpdateQuery<ITransaction> = {
		amount: amount,
		category: categoryID,
		owner: student._id,
		description: description,
		date: date,
	};

	const result = await Transaction.findByIdAndUpdate(transactionID, update, {
		new: true,
	}).exec();

	res.json(
		new CustomResponse(true, result, 'Transaction updated successfully')
	);
});

// TODO: add a new route specifically for updating the amount paid
export const update_transaction_amount = asyncHandler(
	async (req: CustomRequest, res) => {
		const { transactionID } = req.params;
		const { amount }: updateTransactionAmountBody = req.body;

		// check if the given transaction ID is valid
		if (!mongoose.isValidObjectId(transactionID)) {
			res.json(
				new CustomResponse(
					false,
					null,
					`${transactionID} is not a valid transaction ID`
				)
			);
			return;
		}

		const transaction = await Transaction.findById(transactionID)
			.populate({
				model: Category,
				path: 'category',
			})
			.exec();

		if (transaction === null) {
			res.json(
				new CustomResponse(
					false,
					null,
					`Transaction with ID: ${transactionID} does not exists`
				)
			);
			return;
		}

		const category = transaction.category;
		const transactionAmountSum = transaction.amount + amount;

		// check if the amount paid is over the amount required for a category
		if (transactionAmountSum > category.fee) {
			res.json(
				new CustomResponse(
					false,
					null,
					`The amount is over the required amount for ${category.name} fee`
				)
			);
			return;
		}

		// check if the amount paid is non-negative
		if (amount <= 0) {
			res.json(new CustomResponse(false, null, `Enter a valid amount`));
			return;
		}

		// check for errors in validation
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.json(
				new CustomResponse(
					false,
					null,
					'Error in body validation',
					errors.array()[0].msg
				)
			);
			return;
		}

		const update: UpdateQuery<ITransaction> = {
			amount: transactionAmountSum,
		};

		const result = await Transaction.findByIdAndUpdate(
			transaction._id,
			update,
			{ new: true }
		).exec();

		res.json(
			new CustomResponse(
				true,
				result,
				'Transaction amount updated successfully'
			)
		);
	}
);
