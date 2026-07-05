import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import CustomResponse from '../types/response';
import OrganizationModel, { IOrganization } from '../models/organization.model';
import { UpdateQuery } from 'mongoose';
import { ICategoryWithTransactions } from '../types/category';
import {
  BAD_REQUEST,
  NOT_FOUND,
  UNPROCESSABLE_ENTITY,
  UNAUTHORIZED,
} from '../constants/http';
import CategoryModel from '../models/category.model';
import StudentModel from '../models/student.model';

/**
 * GET - get all organizations and its categories
 */
export const get_all_organizations = asyncHandler(async (req, res) => {
  const organizations = await OrganizationModel.aggregate([
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
      const categories = await CategoryModel?.find({
        organization: org._id,
      }).exec();

      const departments = await StudentModel.distinct('course', {
        organization: org._id,
      });

      org.categories = categories;
      org.departments = departments;
      return org;
    }),
  );

  res.json(
    new CustomResponse(true, organizationsWithCategories, 'Organizations'),
  );
});

/**
 * GET - fetch organization data by ID
 */
export const get_organization = asyncHandler(async (req, res) => {
  const { organizationID } = req.params;

  const organization = await OrganizationModel.findById(organizationID);
  appAssert(
    organization,
    NOT_FOUND,
    `Organization with ID ${organizationID} does not exist`,
  );

  const departments = await StudentModel.distinct('course', {
    organization: organizationID,
  });

  res.json(
    new CustomResponse(
      true,
      { ...organization.toObject(), departments },
      'Organization details',
    ),
  );
});

/**
 * GET - fetch the categories under a given organization
 */
export const get_organization_categories = asyncHandler(async (req, res) => {
  const { organizationID } = req.params;

  const org = await OrganizationModel.findById(organizationID);
  appAssert(org, NOT_FOUND, 'Organization not found');

  const categories = await CategoryModel.aggregate<ICategoryWithTransactions>([
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
});

/**
 * POST - create an organization
 */
export const create_organization = asyncHandler(async (req, res) => {
  const {
    name,
    slug,
    governor,
    viceGovernor,
    treasurer,
    auditor,
  }: Omit<IOrganization, '_id'> = req.body;

  const existingSlug = await OrganizationModel.findOne({ slug }).exec();
  appAssert(!existingSlug, BAD_REQUEST, 'Organization slug already exists');

  // create and save the organization
  const organization = new OrganizationModel({
    name,
    slug,
    governor,
    viceGovernor,
    treasurer,
    auditor,
  });
  await organization.save();

  res.json(
    new CustomResponse(true, organization, 'Organization created successfully'),
  );
});

/**
 * DELETE - delete an organization by ID in params
 */
export const delete_organization = asyncHandler(async (req, res) => {
  const { organizationID } = req.params;

  appAssert(
    organizationID === req.tenantContext!.organizationId?.toString(),
    UNAUTHORIZED,
    'You do not have permission to delete another organization',
  );

  const categories = await CategoryModel?.find({
    organization: organizationID,
  }).exec();

  appAssert(
    !categories || categories.length === 0,
    UNPROCESSABLE_ENTITY,
    'The organization has existing categories, make sure to handle and delete them first',
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

/**
 * PUT - update an organization by ID
 */
export const update_organization = asyncHandler(async (req, res) => {
  const { organizationID } = req.params;

  appAssert(
    organizationID === req.tenantContext!.organizationId?.toString(),
    UNAUTHORIZED,
    'You do not have permission to update another organization',
  );

  const {
    name,
    slug,
    governor,
    treasurer,
    viceGovernor,
    auditor,
  }: Omit<IOrganization, '_id'> = req.body;

  const existingSlug = await OrganizationModel.findOne({
    slug,
    _id: { $ne: organizationID },
  }).exec();
  appAssert(!existingSlug, BAD_REQUEST, 'Organization slug already exists');

  const update: UpdateQuery<IOrganization> = {
    name: name,
    slug: slug,
    governor: governor,
    viceGovernor: viceGovernor,
    treasurer: treasurer,
    auditor: auditor,
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
    new CustomResponse(true, result, 'Organization created successfully'),
  );
});
