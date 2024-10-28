import asyncHandler from 'express-async-handler';
import { ICategory } from '../models/category';
import { UpdateQuery } from 'mongoose';
import CustomResponse from '../types/response';
import { createCategoryBody } from '../types/organization';
import { CustomRequest } from '../types/request';
import { updateCategoryBody } from '../types/category';

/**
 * GET - fetch all categories
 */
export const get_all_category = asyncHandler(
	async (req: CustomRequest, res) => {
		if (!req.CategoryModel) {
			res
				.status(500)
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
 * GET - fetch a category by ID in params
 */
export const get_category = asyncHandler(async (req: CustomRequest, res) => {
	const { categoryID } = req.params;

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

	// check if the given category exists
	const category = await req.CategoryModel.findById(categoryID)
		.populate({
			model: req.OrganizationModel,
			path: 'organization',
		})
		.exec();

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

	const categoryTransactions = await req.TransactionModel.find({
		category: category._id,
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
		});

	res.json(
		new CustomResponse(true, { category, categoryTransactions }, 'Category')
	);
});

/**
 * GET - fetch the transactions made in a category
 */
export const get_category_transactions = asyncHandler(
	async (req: CustomRequest, res) => {
		const { categoryID } = req.params;

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

		// check if the given category exists
		const category = await req.CategoryModel.findById(categoryID);
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
			.status(500)
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
	const existingOrganization = await req.OrganizationModel.findById(
		organizationID
	);
	if (existingOrganization === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Organization with ID: ${organizationID} does not exist`
			)
		);
		return;
	}

	// create and save the category
	const category = new req.CategoryModel({
		name: name,
		fee: fee,
		organization: organizationID,
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
			.status(500)
			.json(new CustomResponse(false, null, 'CategoryModel not attached'));

		return;
	}

	const transactions = await req.TransactionModel?.find({
		category: categoryID,
	}).exec();

	if (transactions && transactions?.length > 0) {
		res.json(
			new CustomResponse(
				false,
				null,
				'The category has existing transactions, make sure to handle and delete them first'
			)
		);
		return;
	}

	const result = await req.CategoryModel.findByIdAndDelete(categoryID);
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
export const update_category = asyncHandler(async (req: CustomRequest, res) => {
	const { categoryID } = req.params;
	const { name, fee, organizationID }: updateCategoryBody = req.body;

	if (!req.CategoryModel) {
		res
			.status(500)
			.json(new CustomResponse(false, null, 'CategoryModel not attached'));

		return;
	}

	const organization = await req.OrganizationModel?.findById(organizationID);
	if (!organization) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Organization with ID: ${organizationID} not found`
			)
		);
		return;
	}

	// create and save the category
	const update: UpdateQuery<ICategory> = {
		name: name,
		fee: fee,
		organization: organizationID,
	};

	const result = await req.CategoryModel.findByIdAndUpdate(categoryID, update, {
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
