import asyncHandler from 'express-async-handler';
import {
	createTransactionBody,
	EJSTransaction,
	TransactionEJSVariables,
	updateTransactionAmountBody,
} from '../types/transaction';
import mongoose, { UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { CustomRequest, TransactionQueryFilterRequest } from '../types/request';
import fs from 'fs/promises';
import path from 'path';
import { ITransaction } from '../models/transaction';
import { convertToPdf, pdfOutputPath } from '../services/pdfConverter';
import ejs from 'ejs';
import { format } from 'date-fns';
import _ from 'lodash';
import { getPeriodLabel } from '../utils/utils';

/**
 * GET - fetch all transactions made
 */
export const get_all_transactions = asyncHandler(
	async (req: TransactionQueryFilterRequest, res) => {
		res.json(
			new CustomPaginatedResponse(
				true,
				req.filteredTransactions,
				'All transactions',
				// REMINDER: put next & prev here
				-1,
				-1
			)
		);
	}
);

/**
 * GET - get a csv file result of transactions
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
					? format(transaction.date ?? undefined, 'mm/dd/yyyy')
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
 * GET - get a specific transaction based on ID from params
 */
export const get_transaction = asyncHandler(async (req: CustomRequest, res) => {
	const { transactionID } = req.params;

	if (!req.TransactionModel) {
		res
			.status(500)
			.json(new CustomResponse(false, null, 'TransactionModel not attached'));

		return;
	}

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
export const create_transaction = asyncHandler(
	async (req: CustomRequest, res) => {
		const {
			amount,
			categoryID,
			date,
			description,
			studentID,
		}: createTransactionBody = req.body;

		if (!req.TransactionModel || !req.CategoryModel || !req.StudentModel) {
			res
				.status(500)
				.json(
					new CustomResponse(
						false,
						null,
						'TransactionModel | CategoryModel | StudentModel not attached'
					)
				);

			return;
		}

		// check if the category exists
		const category = await req.CategoryModel.findById(categoryID).populate({
			model: req.OrganizationModel,
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

		// check if the student with the given ID exists
		const student = await req.StudentModel.findOne({
			studentID: studentID,
		}).exec();
		if (student === null) {
			res.json(
				new CustomResponse(
					false,
					null,
					`Student with ID: ${studentID} not found`
				)
			);
			return;
		}

		// check if the student already paid
		const isAlreadyPaid = await req.TransactionModel.findOne({
			owner: student._id,
			category: category._id,
		}).exec();
		if (isAlreadyPaid) {
			res.json(
				new CustomResponse(false, null, 'This student has already paid')
			);
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
	}
);

/**
 * DELETE - delete a transaction by given ID in params
 */
export const delete_transaction = asyncHandler(
	async (req: CustomRequest, res) => {
		const { transactionID } = req.params;

		if (!req.TransactionModel) {
			res
				.status(500)
				.json(new CustomResponse(false, null, 'TransactionModel not attached'));

			return;
		}

		const result = await req.TransactionModel.findByIdAndDelete(transactionID);
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
	}
);

/**
 * PUT - update a transaction based on ID in params
 */
export const update_transaction = asyncHandler(
	async (req: CustomRequest, res) => {
		const { transactionID } = req.params;
		const {
			amount,
			categoryID,
			date,
			description,
			studentID,
		}: createTransactionBody = req.body;

		if (!req.CategoryModel || !req.StudentModel || !req.TransactionModel) {
			res
				.status(500)
				.json(
					new CustomResponse(
						false,
						null,
						'CategoryModel | StudentModel | TransactionModel not attached'
					)
				);

			return;
		}

		// check if the category exists
		const category = await req.CategoryModel.findById(categoryID);
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

		// check if the student with the given ID exists
		const student = await req.StudentModel.findOne({
			studentID: studentID,
		}).exec();
		if (student === null) {
			res.json(
				new CustomResponse(
					false,
					null,
					`Student with ID: ${studentID} not found`
				)
			);
			return;
		}

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

		res.json(
			new CustomResponse(true, result, 'Transaction updated successfully')
		);
	}
);

// TODO: add a new route specifically for updating the amount paid
export const update_transaction_amount = asyncHandler(
	async (req: CustomRequest, res) => {
		const { transactionID } = req.params;
		const { amount }: updateTransactionAmountBody = req.body;

		if (!req.CategoryModel || !req.TransactionModel) {
			res
				.status(500)
				.json(
					new CustomResponse(
						false,
						null,
						'CategoryModel | TransactionModel not attached'
					)
				);

			return;
		}

		const transaction = await req.TransactionModel.findById(transactionID)
			.populate({
				model: req.CategoryModel,
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

		const update: UpdateQuery<ITransaction> = {
			amount: transactionAmountSum,
		};

		const result = await req.TransactionModel.findByIdAndUpdate(
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
