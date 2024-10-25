import asyncHandler from 'express-async-handler';
import Organization, { IOrganization } from '../models/organization';
import CustomResponse from '../types/response';
import Category from '../models/category';

/**
 * GET - get all organizations and its categories
 */
export const get_all_organizations = asyncHandler(async (req, res) => {
	const organizations = await Organization.aggregate([
		{
			$lookup: {
				from: 'categories',
				localField: '_id',
				foreignField: 'organization',
				as: 'categories',
			},
		},
		{
			$addFields: {
				categories: '$categories',
			},
		},
	]);

	res.json(new CustomResponse(true, organizations, 'Organizations'));
});

/**
 * GET - fetch organization data by ID
 */
export const get_organization = asyncHandler(async (req, res) => {
	const { organizationID } = req.params;

	const organization = await Organization.findById(organizationID);

	if (organization === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Organization with ID ${organizationID} does not exist`
			)
		);
		return;
	}

	res.json(new CustomResponse(true, organization, 'Organization details'));
});

/**
 * GET - fetch the categories under a given organization
 */
export const get_organization_categories = asyncHandler(async (req, res) => {
	const { organizationID } = req.params;

	const org = await Organization.findById(organizationID);
	if (org === null) {
		res.json(new CustomResponse(false, null, 'Organization not found'));
		return;
	}

	const categories = await Category.aggregate([
		{
			$match: {
				organization: org._id,
			},
		},
		{
			$lookup: {
				from: 'transactions', // collection name of the Transaction model
				localField: '_id',
				foreignField: 'category', // transaction field that links to the student
				as: 'transactions',
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
			$addFields: {
				totalTransactions: { $size: '$transactions' }, // count the number of transactions
				totalTransactionsAmount: { $sum: '$transactions.amount' },
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

	res.json(new CustomResponse(true, categories, 'Organizations categories'));
});

/**
 * POST - create an organization
 */
export const create_organization = asyncHandler(async (req, res) => {
	const { name, governor, treasurer, departments }: Omit<IOrganization, '_id'> =
		req.body;

	if (departments.length === 0) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Enter atleast 1 department for this organization'
			)
		);
		return;
	}

	departments.forEach((dep, index, arr) => (arr[index] = dep.toUpperCase()));

	// create and save the organization
	const organization = new Organization({
		name: name,
		governor: governor,
		treasurer: treasurer,
		departments: departments,
	});
	await organization.save();

	res.json(
		new CustomResponse(true, organization, 'Organization created successfully')
	);
});

/**
 * DELETE - delete an organization by ID in params
 */
export const delete_organization = asyncHandler(async (req, res) => {
	const { organizationID } = req.params;

	const result = await Organization.findByIdAndDelete(organizationID);
	if (result === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Organization with ID: ${organizationID} does not exist`
			)
		);
		return;
	}

	res.json(
		new CustomResponse(true, result, 'Organization deleted successfully')
	);
});
