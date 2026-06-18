import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import appAssert from '../errors/appAssert';
import CustomResponse from '../types/response';
import OrganizationModel, { IOrganization } from '../models/organization.model';
import { UpdateQuery } from 'mongoose';
import {
  BAD_REQUEST,
  NOT_FOUND,
  UNPROCESSABLE_ENTITY,
} from '../constants/http';
import { MODULES } from '../constants/modules';
import { BCRYPT_SALT } from '../constants/env';
import { SUPER_ADMIN } from '../constants';
import UserModel from '../models/user.model';
import RoleModel from '../models/role.model';
import CategoryModel from '../models/category.model';

/**
 * GET /admin/organizations
 * Returns all organizations enriched with user count
 */
export const admin_get_all_organizations = asyncHandler(async (req, res) => {
  const organizations = await OrganizationModel.find({}).lean();

  const enriched = await Promise.all(
    organizations.map(async (org) => {
      const userCount = await UserModel.countDocuments({
        organization: org._id,
      });
      return { ...org, userCount };
    }),
  );

  res.json(new CustomResponse(true, enriched, 'All organizations'));
});

/**
 * POST /admin/organizations
 * Create a new organization (super admin only).
 * Seeds a Super Admin role, a Regular default role, and an org admin user.
 */
export const admin_create_organization = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    governor,
    viceGovernor,
    treasurer,
    auditor,
    departments,
    // Org admin seed credentials
    adminStudentID,
    adminPassword,
    adminFirstname,
    adminLastname,
  } = req.body as Omit<IOrganization, '_id'> & {
    adminStudentID: string;
    adminPassword: string;
    adminFirstname: string;
    adminLastname: string;
  };

  appAssert(
    departments.length > 0,
    BAD_REQUEST,
    'Enter at least 1 department for this organization',
  );
  appAssert(
    typeof departments[0] === 'string',
    BAD_REQUEST,
    'Invalid department',
  );

  departments.forEach((dep, index, arr) => (arr[index] = dep.toUpperCase()));

  const existingSlug = await OrganizationModel.findOne({ slug }).exec();
  appAssert(!existingSlug, BAD_REQUEST, 'Organization slug already exists');

  // ── 1. Create the organization ──────────────────────────────────────────
  const organization = new OrganizationModel({
    name,
    slug,
    governor,
    viceGovernor,
    treasurer,
    auditor,
    departments,
  });
  await organization.save();

  const allPermissions = Object.values(MODULES);

  // ── 2. Seed Super Admin role for this org ──────────────────────────────
  const superAdminRole = await RoleModel.create({
    name: SUPER_ADMIN,
    description: 'Full access to all modules. Auto-managed by the system.',
    permissions: allPermissions,
    isDefault: false,
    organization: organization._id,
    createdBy: req.currentUser!._id,
  });

  // ── 3. Seed org admin user ─────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(
    adminPassword,
    parseInt(BCRYPT_SALT),
  );
  const adminUser = await UserModel.create({
    studentID: adminStudentID,
    firstname: adminFirstname.toLowerCase(),
    lastname: adminLastname.toLowerCase(),
    email: '',
    password: hashedPassword,
    role: 'governor',
    rbacRole: superAdminRole._id,
    roleManuallyAssigned: true,
    verified: true,
    organization: organization._id,
    profile: {
      url: 'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp',
      publicID: 'user/al85leemxkrs2qwnqrvU',
    },
  });

  // Fix placeholder createdBy on the super admin role
  superAdminRole.createdBy = adminUser._id;
  await superAdminRole.save();

  // ── 4. Seed Regular (default) role for this org ────────────────────────
  await RoleModel.create({
    name: 'Regular',
    description:
      'Default role for newly registered students. Provides basic read access.',
    permissions: [
      MODULES.TRANSACTION_READ,
      MODULES.PRELISTING_READ,
      MODULES.CATEGORY_READ,
      MODULES.ORGANIZATION_READ,
    ],
    isDefault: true,
    organization: organization._id,
    createdBy: adminUser._id,
  });

  res.json(
    new CustomResponse(
      true,
      {
        organization,
        seededAdmin: { studentID: adminStudentID },
      },
      'Organization created and seeded successfully',
    ),
  );
});

/**
 * PUT /admin/organizations/:organizationID
 * Update an organization (super admin only)
 */
export const admin_update_organization = asyncHandler(async (req, res) => {
  const { organizationID } = req.params;

  const {
    name,
    slug,
    governor,
    treasurer,
    viceGovernor,
    auditor,
    departments,
  }: Omit<IOrganization, '_id'> = req.body;

  appAssert(
    departments.length > 0,
    BAD_REQUEST,
    'Enter at least 1 department for this organization',
  );

  appAssert(
    typeof departments[0] === 'string',
    BAD_REQUEST,
    'Invalid department',
  );

  departments.forEach((dep, index, arr) => (arr[index] = dep.toUpperCase()));

  const existingSlug = await OrganizationModel.findOne({
    slug,
    _id: { $ne: organizationID },
  }).exec();
  appAssert(!existingSlug, BAD_REQUEST, 'Organization slug already exists');

  const update: UpdateQuery<IOrganization> = {
    name,
    slug,
    governor,
    viceGovernor,
    treasurer,
    auditor,
    departments,
  };

  const result = await OrganizationModel.findByIdAndUpdate(
    organizationID,
    update,
    { new: true },
  ).exec();

  appAssert(
    result,
    NOT_FOUND,
    `Organization with ID: ${organizationID} does not exist`,
  );

  res.json(
    new CustomResponse(true, result, 'Organization updated successfully'),
  );
});

/**
 * DELETE /admin/organizations/:organizationID
 * Delete an organization (super admin only).
 * Blocks if the organization has any categories.
 */
export const admin_delete_organization = asyncHandler(async (req, res) => {
  const { organizationID } = req.params;

  const categories = await CategoryModel.find({
    organization: organizationID,
  }).exec();

  appAssert(
    !categories || categories.length === 0,
    UNPROCESSABLE_ENTITY,
    'The organization has existing categories — delete them first',
  );

  const result = await OrganizationModel.findByIdAndDelete(organizationID);
  appAssert(
    result,
    NOT_FOUND,
    `Organization with ID: ${organizationID} does not exist`,
  );

  res.json(
    new CustomResponse(true, result, 'Organization deleted successfully'),
  );
});
