import asyncHandler from 'express-async-handler';
import Organization, { IOrganization } from '../models/organization';
import { validationResult } from 'express-validator';
import CustomResponse from '../types/response';

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
 * POST - create an organization
 */
export const create_organization = asyncHandler(async (req, res) => {
	const { name, governor, treasurer }: Omit<IOrganization, '_id'> = req.body;

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

	// create and save the organization
	const organization = new Organization({
		name: name,
		governor: governor,
		treasurer: treasurer,
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
