import asyncHandler from 'express-async-handler';
import { IOrganization } from '../models/organization';
import CustomResponse from '../types/response';
import { CustomRequest } from '../types/request';
import { UpdateQuery } from 'mongoose';
import { ICategoryWithTransactions } from '../types/category';
import { ICategory } from '../models/category';

/**
 * GET - get all organizations and its categories
 */
export const get_all_organizations = asyncHandler(
	async (req: CustomRequest, res) => {
		if (!req.OrganizationModel) {
			res
				.status(500)
				.json(
					new CustomResponse(false, null, 'OrganizationModel not attached')
				);

			return;
		}

		const organizations = await req.OrganizationModel.aggregate([
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

		const organizationsWithCategories = await Promise.all(
			organizations.map(async (org) => {
				const categories = await req.CategoryModel?.find({
					organization: org._id,
				}).exec();

				org.categories = categories;
				return org;
			})
		);

		res.json(
			new CustomResponse(true, organizationsWithCategories, 'Organizations')
		);
	}
);

/**
 * GET - fetch organization data by ID
 */
export const get_organization = asyncHandler(
	async (req: CustomRequest, res) => {
		const { organizationID } = req.params;

		if (!req.OrganizationModel) {
			res
				.status(500)
				.json(
					new CustomResponse(false, null, 'OrganizationModel not attached')
				);

			return;
		}

		const organization = await req.OrganizationModel.findById(organizationID);

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
	}
);

/**
 * GET - fetch the categories under a given organization
 */
export const get_organization_categories = asyncHandler(
	async (req: CustomRequest, res) => {
		const { organizationID } = req.params;

		if (!req.OrganizationModel || !req.CategoryModel) {
			res
				.status(500)
				.json(
					new CustomResponse(
						false,
						null,
						'OrganizationModel | CategoryModel not attached'
					)
				);

			return;
		}

		const org = await req.OrganizationModel.findById(organizationID);
		if (org === null) {
			res.json(new CustomResponse(false, null, 'Organization not found'));
			return;
		}

		const categories =
			await req.CategoryModel.aggregate<ICategoryWithTransactions>([
				{
					$match: {
						organization: org._id,
					},
				},
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

		categories.forEach((category) => (category.organization = org));

		res.json(new CustomResponse(true, categories, 'Organizations categories'));
	}
);

/**
 * POST - create an organization
 */
export const create_organization = asyncHandler(
	async (req: CustomRequest, res) => {
		const {
			name,
			governor,
			treasurer,
			departments,
		}: Omit<IOrganization, '_id'> = req.body;

		if (!req.OrganizationModel) {
			res
				.status(500)
				.json(
					new CustomResponse(false, null, 'OrganizationModel not attached')
				);

			return;
		}

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
		const organization = new req.OrganizationModel({
			name: name,
			governor: governor,
			treasurer: treasurer,
			departments: departments,
		});
		await organization.save();

		res.json(
			new CustomResponse(
				true,
				organization,
				'Organization created successfully'
			)
		);
	}
);

/**
 * DELETE - delete an organization by ID in params
 */
export const delete_organization = asyncHandler(
	async (req: CustomRequest, res) => {
		const { organizationID } = req.params;

		if (!req.OrganizationModel) {
			res
				.status(500)
				.json(
					new CustomResponse(false, null, 'OrganizationModel not attached')
				);

			return;
		}

		const categories = await req.CategoryModel?.find({
			organization: organizationID,
		}).exec();

		if (categories && categories.length > 0) {
			res.json(
				new CustomResponse(
					false,
					null,
					'The organization has existing categories, make sure to handle and delete them first'
				)
			);
			return;
		}

		const result = await req.OrganizationModel.findByIdAndDelete(
			organizationID
		);
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
	}
);

/**
 * PUT - update an organization by ID
 */
export const update_organization = asyncHandler(
	async (req: CustomRequest, res) => {
		const { organizationID } = req.params;

		const {
			name,
			governor,
			treasurer,
			departments,
		}: Omit<IOrganization, '_id'> = req.body;

		if (!req.OrganizationModel) {
			res
				.status(500)
				.json(
					new CustomResponse(false, null, 'OrganizationModel not attached')
				);

			return;
		}

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

		const update: UpdateQuery<IOrganization> = {
			name: name,
			governor: governor,
			treasurer: treasurer,
			departments: departments,
		};

		const result = await req.OrganizationModel.findByIdAndUpdate(
			organizationID,
			update,
			{ new: true }
		).exec();

		if (!result) {
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
			new CustomResponse(true, result, 'Organization created successfully')
		);
	}
);
