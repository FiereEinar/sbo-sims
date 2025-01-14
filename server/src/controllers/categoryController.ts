import asyncHandler from 'express-async-handler';
import { ICategory } from '../models/category';
import { UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { createCategoryBody } from '../types/organization';
import { CustomRequest, TransactionQueryFilterRequest } from '../types/request';
import {
	ICategoryWithTransactions,
	updateCategoryBody,
} from '../types/category';
import {
	INTERNAL_SERVER_ERROR,
	NOT_FOUND,
	UNPROCESSABLE_ENTITY,
} from '../constants/http';
import appAssert from '../errors/appAssert';

/**
 * GET - fetch all categories
 */
export const get_all_category = asyncHandler(
	async (req: CustomRequest, res) => {
		if (!req.CategoryModel) {
			res
				.status(INTERNAL_SERVER_ERROR)
				.json(new CustomResponse(false, null, 'CategoryModel not attached'));

			return;
		}

		const categories = await req.CategoryModel.find().populate({
			model: req.OrganizationModel,
			path: 'organization',
		});

		res.json(new CustomResponse(true, categories, 'All categories'));
	}
);

/**
 * GET - fetch all categories along with its total transactions and total amount
 */
export const get_all_category_with_transactions_data = asyncHandler(
	async (req: CustomRequest, res) => {
		if (!req.CategoryModel) {
			res
				.status(INTERNAL_SERVER_ERROR)
				.json(new CustomResponse(false, null, 'CategoryModel not attached'));

			return;
		}

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

		if (!req.CategoryModel || !req.TransactionModel) {
			res
				.status(INTERNAL_SERVER_ERROR)
				.json(
					new CustomResponse(
						false,
						null,
						'CategoryModel | TransactionModel not attached'
					)
				);

			return;
		}

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
export const get_category_transactions = asyncHandler(
	async (req: CustomRequest, res) => {
		const { categoryID } = req.params;

		if (!req.CategoryModel || !req.TransactionModel) {
			res
				.status(INTERNAL_SERVER_ERROR)
				.json(
					new CustomResponse(
						false,
						null,
						'CategoryModel | TransactionModel not attached'
					)
				);

			return;
		}

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
	}
);

/**
 * POST - create a category
 */
export const create_category = asyncHandler(async (req: CustomRequest, res) => {
	const { name, fee, organizationID }: createCategoryBody = req.body;

	if (!req.CategoryModel || !req.OrganizationModel) {
		res
			.status(INTERNAL_SERVER_ERROR)
			.json(
				new CustomResponse(
					false,
					null,
					'CategoryModel | OrganizationModel not attached'
				)
			);

		return;
	}

	// check if the organization exists
	const organization = await req.OrganizationModel.findById(organizationID);
	appAssert(
		organization,
		NOT_FOUND,
		`Organization with ID: ${organizationID} does not exist`
	);

	// create and save the category
	const category = new req.CategoryModel({
		name: name,
		fee: fee,
		organization: organization._id,
	});
	await category.save();

	res.json(new CustomResponse(true, category, 'Category created successfully'));
});

/**
 * DELETE - delete a category by given ID in params
 */
export const delete_category = asyncHandler(async (req: CustomRequest, res) => {
	const { categoryID } = req.params;

	if (!req.CategoryModel) {
		res
			.status(INTERNAL_SERVER_ERROR)
			.json(new CustomResponse(false, null, 'CategoryModel not attached'));

		return;
	}

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

/**
 * PUT - update a category based on ID in params
 */
export const update_category = asyncHandler(async (req: CustomRequest, res) => {
	const { categoryID } = req.params;
	const { name, fee, organizationID }: updateCategoryBody = req.body;

	if (!req.CategoryModel) {
		res
			.status(INTERNAL_SERVER_ERROR)
			.json(new CustomResponse(false, null, 'CategoryModel not attached'));

		return;
	}

	const organization = await req.OrganizationModel?.findById(organizationID);
	appAssert(
		organization,
		NOT_FOUND,
		`Organization with ID: ${organizationID} not found`
	);

	// create and save the category
	const update: UpdateQuery<ICategory> = {
		name: name,
		fee: fee,
		organization: organizationID,
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
