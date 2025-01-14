import ejs from 'ejs';
import _ from 'lodash';
import path from 'path';
import fs from 'fs/promises';
import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { getPeriodLabel } from '../utils/utils';
import { ICategory } from '../models/category';
import { UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { TransactionQueryFilterRequest } from '../types/request';
import { ITransaction } from '../models/transaction';
import { convertToPdf, pdfOutputPath } from '../services/pdfConverter';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { BAD_REQUEST, CONFLICT, CREATED, NOT_FOUND } from '../constants/http';
import {
	createTransactionBody,
	EJSTransaction,
	TransactionEJSVariables,
	updateTransactionAmountBody,
} from '../types/transaction';

/**
 * GET - fetch all transactions made
 */
export const get_all_transactions = asyncHandler(
	async (req: TransactionQueryFilterRequest, res) => {
		const splicedFilteredTransactions = req.filteredTransactions?.splice(
			req.skipAmount ?? 0,
			req.pageSizeNum
		);

		res.json(
			new CustomPaginatedResponse(
				true,
				splicedFilteredTransactions,
				'All transactions',
				req.nextPage ?? -1,
				req.prevPage ?? -1
			)
		);
	}
);

/**
 * GET - get a pdf file result of transactions
 */
export const get_transaction_list_file = asyncHandler(
	async (req: TransactionQueryFilterRequest, res) => {
		if (req.filteredTransactions) {
			const template = await fs.readFile(
				path.join(__dirname, '../', 'templates', 'transactionsPDF.ejs'),
				{ encoding: 'utf8' }
			);

			let EJSData: TransactionEJSVariables = {
				dateToday: format(new Date(), 'MMMM dd, yyyy'),
				period: getPeriodLabel(req.query.period as string) ?? 'Today',
				totalAmount: 0,
				transactions: [],
			};

			req.filteredTransactions.forEach((transaction) => {
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
					organization: `${_.startCase(
						transaction.category.organization.name
					)}`,
					course: transaction.owner.course.toUpperCase(),
					date: tDate,
					fullname: _.startCase(
						`${transaction.owner.firstname} ${transaction.owner.middlename} ${transaction.owner.lastname}`
					),
					status: tStatus,
					studentID: transaction.owner.studentID,
					year: transaction.owner.year.toString(),
				};

				EJSData.transactions.push(t);
				EJSData.totalAmount += transaction.amount;
			});

			const html = ejs.render(template, EJSData);

			await convertToPdf(html);

			res.sendFile(
				path.join(__dirname, '../', '../', pdfOutputPath),
				async (err) => {
					if (err) {
						res.sendStatus(500);
						return;
					}
					await fs.unlink(pdfOutputPath);
				}
			);
		}
	}
);

/**
 * GET - dashboard data
 */
export const get_dashboard_data = asyncHandler(async (req, res) => {
	/**
	 * Transactions related logic
	 */
	const result = await req.TransactionModel?.find();
	let totalRevenue = 0;
	let totalRevenueLastMonth = 0;
	let totalTransactionLastMonth = 0;

	const prevMonth = new Date();
	prevMonth.setMonth(prevMonth.getMonth()); // reduces the month by 1
	prevMonth.setDate(0);

	result?.map((t) => {
		totalRevenue += t.amount;
		if (isBefore(t.date as Date, prevMonth)) {
			totalRevenueLastMonth += t.amount;
			totalTransactionLastMonth++;
		}
	});

	const transactions = await req.TransactionModel?.aggregate([
		{
			$group: {
				_id: '$date',
				totalAmount: { $sum: '$amount' },
			},
		},
		{
			$project: {
				_id: 0,
				date: '$_id',
				totalAmount: 1,
			},
		},
		{
			$sort: { date: 1 },
		},
		{
			$limit: 90, // 3 months
		},
	]);

	const transactionsToday = await req.TransactionModel?.countDocuments({
		$and: [
			{ date: { $gte: startOfDay(new Date()) } },
			{ date: { $lt: startOfDay(addDays(new Date(), 1)) } },
		],
	});

	/**
	 * Categories related logic
	 */
	type CategoryObjResponse = {
		category: ICategory;
		totalAmount: number;
		totalTransactions: number;
	};

	const categories = await req.CategoryModel?.find({}).populate({
		model: req.OrganizationModel,
		path: 'organization',
	});

	const categoriesMap: { [key: string]: CategoryObjResponse } = {};

	categories?.map(
		(cat) =>
			(categoriesMap[cat._id] = {
				category: cat,
				totalAmount: 0,
				totalTransactions: 0,
			} as CategoryObjResponse)
	);

	const allTransactions = await req.TransactionModel?.find({})
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
		});

	allTransactions?.map((trans) => {
		const c = categoriesMap[trans.category._id];
		if (c === undefined) return;

		c.totalAmount += trans.amount;
		c.totalTransactions++;

		categoriesMap[trans.category._id] = c;
	});

	const categoriesArray: CategoryObjResponse[] = [
		...Object.values(categoriesMap),
	];

	/**
	 * Students related logic
	 */
	const totalStudents = await req.StudentModel?.countDocuments();

	res.json(
		new CustomResponse(
			true,
			{
				totalRevenue,
				totalRevenueLastMonth,
				totalTransaction: result?.length ?? 0,
				totalTransactionLastMonth,
				transactionsToday,
				totalStudents,
				transactions,
				categories: categoriesArray,
			},
			'Dashboard data'
		)
	);
});

/**
 * GET - get a specific transaction based on ID from params
 */
export const get_transaction = asyncHandler(async (req, res) => {
	const { transactionID } = req.params;

	const transaction = await req.TransactionModel.findById(transactionID)
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
		});

	appAssert(
		transaction,
		NOT_FOUND,
		`Transaction with ID: ${transactionID} not found`
	);

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

	// check if the category exists
	const category = await req.CategoryModel.findById(categoryID).populate({
		model: req.OrganizationModel,
		path: 'organization',
	});
	appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

	// check if the amount paid is over the amount required for a category
	appAssert(
		amount <= category.fee,
		BAD_REQUEST,
		`The amount is over the required amount for ${category.name} fee. Fee is ${category.fee}`
	);

	// check if the amount paid is non-negative
	appAssert(amount > 0, BAD_REQUEST, `Enter a valid amount`);

	// check if the student with the given ID exists
	const student = await req.StudentModel.findOne({
		studentID: studentID,
	}).exec();
	appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

	// check if the student already paid
	const isAlreadyPaid = await req.TransactionModel.findOne({
		owner: student._id,
		category: category._id,
	}).exec();
	appAssert(!isAlreadyPaid, CONFLICT, 'This student has already paid');

	// check if the student is within the organization
	const isInOrganization = category.organization.departments.includes(
		student.course
	);
	appAssert(
		isInOrganization,
		BAD_REQUEST,
		`Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`
	);

	// create and save the transaction
	const transaction = new req.TransactionModel({
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

	const result = await req.TransactionModel.findByIdAndDelete(transactionID);
	appAssert(
		result,
		NOT_FOUND,
		`Transaction with ID: ${transactionID} does not exists`
	);

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

	// check if the category exists
	const category = await req.CategoryModel.findById(categoryID).populate({
		model: req.OrganizationModel,
		path: 'organization',
	});
	appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

	// check if the amount paid is over the amount required for a category
	appAssert(
		amount <= category.fee,
		BAD_REQUEST,
		`The amount is over the required amount for ${category.name} fee (${category.fee})`
	);

	// check if the amount paid is non-negative
	appAssert(amount > 0, BAD_REQUEST, 'Enter a valid amount');

	// check if the student with the given ID exists
	const student = await req.StudentModel.findOne({
		studentID: studentID,
	}).exec();
	appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

	// check if the student is within the organization
	const isInOrganization = category.organization.departments.includes(
		student.course
	);
	appAssert(
		isInOrganization,
		BAD_REQUEST,
		`Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`
	);

	// create update query and save the transaction
	const update: UpdateQuery<ITransaction> = {
		amount: amount,
		category: categoryID,
		owner: student._id,
		description: description,
		date: date?.toISOString(),
	};

	const result = await req.TransactionModel.findByIdAndUpdate(
		transactionID,
		update,
		{
			new: true,
		}
	).exec();

	appAssert(
		result,
		NOT_FOUND,
		`Transaction with ID: ${transactionID} not found`
	);

	res.json(
		new CustomResponse(true, result, 'Transaction updated successfully')
	);
});

// TODO: add a new route specifically for updating the amount paid
export const update_transaction_amount = asyncHandler(async (req, res) => {
	const { transactionID } = req.params;
	const { amount }: updateTransactionAmountBody = req.body;

	const transaction = await req.TransactionModel.findById(transactionID)
		.populate({
			model: req.CategoryModel,
			path: 'category',
		})
		.exec();

	appAssert(
		transaction,
		NOT_FOUND,
		`Transaction with ID: ${transactionID} does not exists`
	);

	const category = transaction.category;
	const transactionAmountSum = transaction.amount + amount;

	// check if the amount paid is over the amount required for a category
	appAssert(
		transactionAmountSum <= category.fee,
		BAD_REQUEST,
		`The amount is over the required amount for ${category.name} fee`
	);

	// check if the amount paid is non-negative
	appAssert(amount > 0, BAD_REQUEST, 'Enter a valid amount');

	const update: UpdateQuery<ITransaction> = {
		amount: transactionAmountSum,
	};

	const result = await req.TransactionModel.findByIdAndUpdate(
		transaction._id,
		update,
		{ new: true }
	).exec();

	res.json(
		new CustomResponse(true, result, 'Transaction amount updated successfully')
	);
});
