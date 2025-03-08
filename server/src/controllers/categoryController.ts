import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { ICategory } from '../models/category';
import { UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { TransactionQueryFilterRequest } from '../types/request';
import {
	BAD_REQUEST,
	NOT_FOUND,
	UNPROCESSABLE_ENTITY,
} from '../constants/http';
import {
	createCategoryBody,
	ICategoryWithTransactions,
	updateCategoryBody,
} from '../types/category';

/**
 * GET - fetch all categories
 */
export const get_all_category = asyncHandler(async (req, res) => {
	const categories = await req.CategoryModel.find().populate({
		model: req.OrganizationModel,
		path: 'organization',
	});

	res.json(new CustomResponse(true, categories, 'All categories'));
});

/**
 * GET - fetch all categories along with its total transactions and total amount
 */
export const get_all_category_with_transactions_data = asyncHandler(
	async (req, res) => {
		const categoriesWithOrg = await req.CategoryModel.find().populate({
			model: req.OrganizationModel,
			path: 'organization',
		});

		const categories =
			await req.CategoryModel.aggregate<ICategoryWithTransactions>([
				{
					$lookup: {
						from: 'transactions',
						localField: '_id',
						foreignField: 'category',
						as: 'transaction',
					},
				},
				{
					$addFields: {
						totalTransactions: { $size: '$transaction' },
						totalTransactionsAmount: { $sum: '$transaction.amount' },
					},
				},
				{
					$project: {
						transaction: 0,
					},
				},
			]);

		const orgMap = new Map(
			categoriesWithOrg.map((category) => [
				category._id.toString(),
				category.organization,
			])
		);

		categories.forEach((category) => {
			const org = orgMap.get(category._id.toString());
			if (org) category.organization = org;
		});

		res.json(
			new CustomResponse(
				true,
				categories,
				'All categories with transactions data'
			)
		);
	}
);

/**
 * GET - fetch a category by ID in params
 */
export const get_category = asyncHandler(
	async (req: TransactionQueryFilterRequest, res) => {
		const { categoryID } = req.params;

		// check if the given category exists
		const category = await req.CategoryModel.findById(categoryID)
			.populate({
				model: req.OrganizationModel,
				path: 'organization',
			})
			.exec();

		appAssert(category, NOT_FOUND, `Category wit ID: ${categoryID} not found`);

		const categoryTransactions = req.filteredTransactions?.splice(
			req.skipAmount ?? 0,
			req.pageSizeNum
		);

		res.json(
			new CustomPaginatedResponse(
				true,
				{ category, categoryTransactions },
				'Category',
				req.nextPage ?? -1,
				req.prevPage ?? -1
			)
		);
	}
);

/**
 * GET - fetch the transactions made in a category
 */
export const get_category_transactions = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;

	// check if the given category exists
	const category = await req.CategoryModel.findById(categoryID);
	appAssert(category, NOT_FOUND, `Category wit ID: ${categoryID} not found`);

	const categoryTransactions = await req.TransactionModel.find({
		category: category._id,
	})
		.populate({ model: req.StudentModel, path: 'owner' })
		.populate({
			model: req.CategoryModel,
			path: 'category',
			populate: {
				model: req.OrganizationModel,
				path: 'organization',
			},
		})
		.exec();

	res.json(
		new CustomResponse(true, categoryTransactions, 'Category transactions')
	);
});

/**
 * POST - create a category
 */
export const create_category = asyncHandler(async (req, res) => {
	const { name, fee, organizationID, details }: createCategoryBody = req.body;
	// check if the organization exists
	const organization = await req.OrganizationModel.findById(organizationID);
	appAssert(
		organization,
		NOT_FOUND,
		`Organization with ID: ${organizationID} does not exist`
	);

	appAssert(fee > 0, BAD_REQUEST, 'Please enter a non-negative number for fee');

	// create and save the category
	const category = new req.CategoryModel({
		name: name,
		fee: fee,
		organization: organization._id,
		details: details,
	});
	await category.save();

	res.json(new CustomResponse(true, category, 'Category created successfully'));
});

/**
 * PUT - update a category based on ID in params
 */
export const update_category = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;
	const { name, fee, organizationID, details }: updateCategoryBody = req.body;

	// appAssert(Array.isArray(details), BAD_REQUEST, 'Details should be an array');
	console.log(details);
	const organization = await req.OrganizationModel?.findById(organizationID);
	appAssert(
		organization,
		NOT_FOUND,
		`Organization with ID: ${organizationID} not found`
	);

	appAssert(fee > 0, BAD_REQUEST, 'Please enter a non-negative number for fee');

	// create and save the category
	const update: UpdateQuery<ICategory> = {
		name: name,
		fee: fee,
		organization: organizationID,
		details: details,
	};

	const result = await req.CategoryModel.findByIdAndUpdate(categoryID, update, {
		new: true,
	}).exec();

	appAssert(
		result,
		NOT_FOUND,
		`Category with ID: ${categoryID} does not exist`
	);

	res.json(new CustomResponse(true, result, 'Category updated successfully'));
});

/**
 * DELETE - delete a category by given ID in params
 */
export const delete_category = asyncHandler(async (req, res) => {
	const { categoryID } = req.params;

	const transactions = await req.TransactionModel?.find({
		category: categoryID,
	}).exec();

	appAssert(
		!transactions || transactions.length === 0,
		UNPROCESSABLE_ENTITY,
		'The category has existing transactions, make sure to handle and delete them first'
	);

	const result = await req.CategoryModel.findByIdAndDelete(categoryID);
	appAssert(result, NOT_FOUND, `Category with ID ${categoryID} does not exist`);

	res.json(new CustomResponse(true, result, 'Category deleted successfully'));
});
