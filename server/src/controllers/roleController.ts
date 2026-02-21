import asyncHandler from 'express-async-handler';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { BAD_REQUEST, NOT_FOUND } from '../constants/http';
import appAssert from '../errors/appAssert';
import { SUPER_ADMIN } from '../constants';
import { Modules, MODULES } from '../constants/modules';

/**
 * @route GET /api/v1/role
 * @query page=1
 * @query pageSize=10
 * @query search=keyword
 */
export const getRoles = asyncHandler(async (req, res) => {
	const {
		page = 1,
		pageSize = 10,
		search = '',
	} = req.query as Record<string, string>;

	const numericPage = Number(page);
	const limit = Number(pageSize);
	const skip = (numericPage - 1) * limit;

	/** ---------------------
	 *        FILTERS
	 *  --------------------*/
	const filter: Record<string, any> = {};

	// search: name, description
	if (search.trim() !== '') {
		const regex = { $regex: search, $options: 'i' };
		filter.$or = [{ name: regex }, { description: regex }];
	}

	/** ---------------------
	 *     FETCH DATA
	 *  --------------------*/
	const roles = await req.RoleModel.find(filter)
		.populate('createdBy', 'name studentID')
		.skip(skip)
		.limit(limit)
		.exec();

	const total = await req.RoleModel.countDocuments(filter);

	// calculate pagination
	const next = skip + limit < total ? numericPage + 1 : -1;
	const prev = numericPage > 1 ? numericPage - 1 : -1;

	res.json(
		new CustomPaginatedResponse(true, roles, 'Roles fetched', next, prev),
	);
});

/**
 * @route GET /api/v1/role/:roleID
 */
export const getSingleRole = asyncHandler(async (req, res) => {
	const { roleID } = req.params;

	const role = await req.RoleModel.findById(roleID)
		.populate('createdBy', 'name studentID')
		.exec();

	appAssert(role, NOT_FOUND, 'Role not found');

	res.json(new CustomResponse(true, role, 'Role fetched'));
});

/**
 * @route POST /api/v1/role
 * @body { name: string, description?: string, permissionIds: string[] }
 */
export const createRole = asyncHandler(async (req, res) => {
	const { name, description } = req.body;

	appAssert(name, BAD_REQUEST, 'Role name is required');

	appAssert(
		name !== SUPER_ADMIN,
		BAD_REQUEST,
		'Cannot create Super Admin role',
	);

	const role = await req.RoleModel.create({
		name,
		description,
		permissions: [],
		createdBy: req.currentUser._id,
	});

	const populatedRole = await req.RoleModel.findById(role._id)
		.populate('permissions')
		.populate('createdBy', 'name studentID');

	res.json(
		new CustomResponse(true, populatedRole, 'Role created successfully'),
	);
});

/**
 * @route PATCH /api/v1/role/:roleID
 * @body { name?: string, description?: string, permissions?: string[] }
 */
export const updateRole = asyncHandler(async (req, res) => {
	const { roleID } = req.params;
	const { name, description, permissions } = req.body;

	const role = await req.RoleModel.findById(roleID);
	appAssert(role, NOT_FOUND, 'Role not found');

	appAssert(
		role.name !== SUPER_ADMIN,
		BAD_REQUEST,
		'Cannot update Super Admin role',
	);

	// Validate permissions
	if (permissions && permissions.length > 0) {
		const validPermissions = Object.values(MODULES);
		const invalidPermissions = permissions.filter(
			(perm: string) => !validPermissions.includes(perm as Modules),
		);
		appAssert(
			invalidPermissions.length === 0,
			BAD_REQUEST,
			`Invalid permissions: ${invalidPermissions.join(', ')}`,
		);
	}

	const updateData: any = {};
	if (name !== undefined) updateData.name = name;
	if (description !== undefined) updateData.description = description;
	if (permissions !== undefined) updateData.permissions = permissions;

	const updatedRole = await req.RoleModel.findByIdAndUpdate(
		roleID,
		updateData,
		{
			new: true,
		},
	).populate('createdBy', 'name studentID');

	res.json(new CustomResponse(true, updatedRole, 'Role updated successfully'));
});

/**
 * @route DELETE /api/v1/role/:roleID
 */
export const deleteRole = asyncHandler(async (req, res) => {
	const { roleID } = req.params;

	const role = await req.RoleModel.findById(roleID);
	appAssert(role, NOT_FOUND, 'Role not found');
	appAssert(
		role.name !== SUPER_ADMIN,
		BAD_REQUEST,
		'Cannot delete Super Admin role',
	);

	const usersWithRole = await req.UserModel.find({ rbacRole: roleID });
	appAssert(
		usersWithRole.length === 0,
		BAD_REQUEST,
		'Cannot delete role with users',
	);

	await req.RoleModel.findByIdAndDelete(roleID);

	res.json(new CustomResponse(true, null, 'Role deleted successfully'));
});
