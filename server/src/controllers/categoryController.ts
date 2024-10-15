import asyncHandler from 'express-async-handler';
import Category, { ICategory } from '../models/category';
import mongoose, { UpdateQuery } from 'mongoose';
import { validationResult } from 'express-validator';
import Transaction from '../models/transaction';
import Student from '../models/student';
import CustomResponse from '../types/response';
import Organization from '../models/organization';
import { ICategoryWithTransactions } from '../types/category';
import organization from '../models/organization';

/**
 * GET - fetch all categories
 */
export const get_all_category = asyncHandler(async (req, res) => {
	// const categories = await Category.find().populate({
	// 	model: Organization,
	// 	path: 'organization',
	// });
	const categories = await Category.aggregate([
		{
			$lookup: {
				from: 'transactions', // collection name of the Transaction model
				localField: '_id',
				foreignField: 'category', // transaction field that links to the student
				as: 'transactions',
			},
		},
		{
			$addFields: {
				totalTransactions: { $size: '$transactions' }, // count the number of transactions
				totalTransactionsAmount: { $sum: '$transactions.amount' },
			},
		},
		{
			$lookup: {
				from: 'organizations',
				localField: 'organization',
				foreignField: '_id',
				as: 'organization',
			},
		},
		{
			$unwind: '$organization',
		},
		{
			$project: {
				transactions: 0, // exclude the transactions array from the result
			},
		},
	]);

	res.json(new CustomResponse(true, categories, 'All categories'));
});

/**
 * GET - fetch a category by ID in params
 */
export const get_category = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;

	// check if the given ID is valid
	if (!mongoose.isValidObjectId(categoryID)) {
		res.json(
			new CustomResponse(false, null, `${categoryID} is not a valid ID`)
		);
		return;
	}

	// check if the given category exists
	const category = await Category.findById(categoryID);
	if (category === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Category wit ID: ${categoryID} not found`
			)
		);
		return;
	}

	const categoryTransactions = await Transaction.find({
		category: category._id,
	})
		.populate({
			model: Category,
			path: 'category',
		})
		.populate({
			model: Student,
			path: 'owner',
		});

	res.json(
		new CustomResponse(true, { category, categoryTransactions }, 'Category')
	);
});

/**
 * GET - fetch the transactions made in a category
 */
export const get_category_transactions = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;

	// check if the given ID is valid
	if (!mongoose.isValidObjectId(categoryID)) {
		res.json(
			new CustomResponse(false, null, `${categoryID} is not a valid ID`)
		);
		return;
	}

	// check if the given category exists
	const category = await Category.findById(categoryID);
	if (category === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Category wit ID: ${categoryID} not found`
			)
		);
		return;
	}

	const categoryTransactions = await Transaction.find({
		category: category._id,
	})
		.populate({ model: Student, path: 'owner' })
		.populate({ model: Category, path: 'category' })
		.exec();

	res.json(
		new CustomResponse(true, categoryTransactions, 'Category transactions')
	);
});

/**
 * POST - create a category
 */
export const create_category = asyncHandler(async (req, res) => {
	const { name, fee, organization }: Omit<ICategory, '_id'> = req.body;

	// check for validation errors
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

	// check if the organization exists
	const existingOrganization = await Organization.findById(organization);
	if (existingOrganization === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Organization with ID: ${organization} does not exist`
			)
		);
		return;
	}

	// create and save the category
	const category = new Category({
		name: name,
		fee: fee,
		organization: organization,
	});
	await category.save();

	res.json(new CustomResponse(true, category, 'Category created successfully'));
});

/**
 * DELETE - delete a category by given ID in params
 */
export const delete_category = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;

	// check if the given ID is valid
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

	const result = await Category.findByIdAndDelete(categoryID);
	if (result === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Category with ID ${categoryID} does not exist`
			)
		);
		return;
	}

	res.json(new CustomResponse(true, result, 'Category deleted successfully'));
});

/**
 * PUT - update a category based on ID in params
 */
export const update_category = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;
	const { name }: Omit<ICategory, '_id'> = req.body;

	// check if the given ID is valid
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

	// check for validation errors
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

	// create and save the category
	const update: UpdateQuery<ICategory> = {
		name: name,
	};

	const result = await Category.findByIdAndUpdate(categoryID, update, {
		new: true,
	}).exec();

	if (result === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Category with ID: ${categoryID} does not exist`
			)
		);
		return;
	}

	res.json(new CustomResponse(true, result, 'Category updated successfully'));
});
