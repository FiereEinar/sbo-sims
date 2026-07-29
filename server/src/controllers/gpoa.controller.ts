import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import {
  CreateGpoaBody,
  createGpoaSchema,
  UpdateGpoaBody,
  updateGpoaSchema,
} from '../middlewares/validations/gpoa.validation';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import GpoaModel from '../models/gpoa.model';
import CustomResponse from '../types/response';

/**
 * POST - Create a GPOA (GPOA_CREATE)
 */
export const create_gpoa = asyncHandler(async (req, res) => {
  const parseResult = createGpoaSchema.safeParse(req.body);

  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const { name, description, targetDate, venue, budget, status }: CreateGpoaBody =
    parseResult.data;

  const existingGpoa = await GpoaModel.findOne({
    name,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();

  appAssert(
    existingGpoa === null,
    CONFLICT,
    `A GPOA plan with the name "${name}" already exists for this term`,
  );

  const gpoa = new GpoaModel({
    name,
    description,
    targetDate,
    venue,
    budget,
    status: status || 'upcoming',
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });

  await gpoa.save();

  res.json(new CustomResponse(true, gpoa, 'GPOA plan created successfully'));
});

/**
 * GET - Read All GPOA for Tenant (GPOA_READ)
 */
export const get_all_gpoa = asyncHandler(async (req, res) => {
  const gpoas = await GpoaModel.find({
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json(new CustomResponse(true, gpoas, 'GPOA plans retrieved successfully'));
});

/**
 * GET - Read Single GPOA by ID
 */
export const get_single_gpoa = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'GPOA ID parameter is required');

  const gpoa = await GpoaModel.findOne({
    _id: id,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(gpoa !== null, NOT_FOUND, 'GPOA plan not found or access denied');

  res.json(new CustomResponse(true, gpoa, 'GPOA plan retrieved successfully'));
});

/**
 * PUT/PATCH - Update a GPOA (GPOA_UPDATE)
 */
export const update_gpoa = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'GPOA ID parameter is required');

  const parseResult = updateGpoaSchema.safeParse(req.body);
  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const updateData: UpdateGpoaBody = parseResult.data;

  const updatedGpoa = await GpoaModel.findOneAndUpdate(
    {
      _id: id,
      organization: req.tenantContext!.organizationId,
    },
    { $set: updateData },
    { new: true, runValidators: true },
  ).exec();

  appAssert(
    updatedGpoa !== null,
    NOT_FOUND,
    'GPOA plan not found or access denied',
  );

  res.json(
    new CustomResponse(true, updatedGpoa, 'GPOA plan updated successfully'),
  );
});

/**
 * DELETE - Delete a GPOA (GPOA_DELETE)
 */
export const delete_gpoa = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'GPOA ID parameter is required');

  const deletedGpoa = await GpoaModel.findOneAndDelete({
    _id: id,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(
    deletedGpoa !== null,
    NOT_FOUND,
    'GPOA plan not found or access denied',
  );

  res.json(new CustomResponse(true, null, 'GPOA plan deleted successfully'));
});
