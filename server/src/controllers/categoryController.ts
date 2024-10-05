import asyncHandler from 'express-async-handler';
import Category, { ICategory } from '../models/category';
import CustomResponse from '../utils/custom-response';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

/**
 * GET - fetch all categories
 */
export const get_all_category = asyncHandler(async (req, res) => {
	const categories = await Category.find();

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

	res.json(new CustomResponse(true, category, 'Category'));
});

/**
 * POST - create a category
 */
export const create_category = asyncHandler(async (req, res) => {
	const { name }: Omit<ICategory, '_id'> = req.body;

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
	const category = new Category({
		name: name,
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
});
