import asyncHandler from 'express-async-handler';
import Transaction, { ITransaction } from '../models/transaction';
import Category from '../models/category';
import Student from '../models/student';
import { createTransactionBody } from '../types/transaction';
import { validationResult } from 'express-validator';
import mongoose, { UpdateQuery } from 'mongoose';
import CustomResponse from '../types/response';

/**
 * GET - fetch all transactions made
 * TODO: implement paganation
 */
export const get_all_transactions = asyncHandler(async (req, res) => {
	const transactions = await Transaction.find()
		.populate({
			model: Category,
			path: 'category',
		})
		.populate({
			model: Student,
			path: 'owner',
		});

	res.json(new CustomResponse(true, transactions, 'All transactions'));
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
	const transaction = new Transaction({
		amount: amount,
		category: categoryID,
		owner: student._id,
		description: description,
		date: date,
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
