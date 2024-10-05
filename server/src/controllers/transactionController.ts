import asyncHandler from 'express-async-handler';
import Transaction, { ITransaction } from '../models/transaction';
import CustomResponse from '../utils/custom-response';
import Category from '../models/category';
import { createTransactionBody } from '../types/transaction';
import Student from '../models/student';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

/**
 * GET - fetch all transactions made
 * TODO: implement paganation
 */
export const get_all_transactions = asyncHandler(async (req, res) => {
	const transactions = await Transaction.find().populate({
		model: Category,
		path: 'category',
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

	const transaction = await Transaction.findById(transactionID);
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

	if (!mongoose.isValidObjectId(categoryID)) {
		res.json(
			new CustomResponse(false, null, `${categoryID} is not a valid ID`)
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
