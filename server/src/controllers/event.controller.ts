import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import {
  CreateEventBody,
  createEventSchema,
  UpdateEventBody,
  updateEventSchema,
} from '../middlewares/validations/event.validation';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import EventModel from '../models/event.model';
import CustomResponse from '../types/response';

/**
 * POST - Create an Event (EVENT_CREATE)
 */
export const create_event = asyncHandler(async (req, res) => {
  // Validate request body using Zod
  const parseResult = createEventSchema.safeParse(req.body);

  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const { title, description, venue, start, end }: CreateEventBody =
    parseResult.data;

  // Check if an event with the exact same title already exists within this organization
  const existingEvent = await EventModel.findOne({
    title,
    organization: req.tenantContext!.organizationId,
    archived: false,
  }).exec();

  appAssert(
    existingEvent === null,
    CONFLICT,
    `An active event with the title "${title}" already exists`,
  );

  // Create and save event scoped to the tenant organization
  const event = new EventModel({
    title,
    description,
    venue,
    start,
    end,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });

  await event.save();

  res.json(new CustomResponse(true, event, 'Event created successfully'));
});

/**
 * GET - Read All Events for Tenant (EVENT_READ)
 */
export const get_all_events = asyncHandler(async (req, res) => {
  const events = await EventModel.aggregate([
    {
      $match: {
        organization: req.tenantContext!.organizationId,
        semester: req.tenantContext!.semester,
        schoolYear: req.tenantContext!.schoolYear,
        archived: false,
      },
    },
    {
      $lookup: {
        from: 'eventsessionmodels',
        localField: '_id',
        foreignField: 'event',
        as: 'sessions',
      },
    },
    {
      $addFields: {
        sessionsCount: { $size: '$sessions' },
      },
    },
    {
      $project: {
        sessions: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  res.json(new CustomResponse(true, events, 'Events retrieved successfully'));
});

/**
 * GET - Read Single Event by ID
 */
export const get_single_event = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'Event ID parameter is required');

  // Verify the event exists, is active, and belongs to this tenant organization
  const event = await EventModel.findOne({
    _id: id,
    organization: req.tenantContext!.organizationId,
    archived: false,
  }).exec();

  appAssert(event !== null, NOT_FOUND, 'Event not found or access denied');

  res.json(new CustomResponse(true, event, 'Event retrieved successfully'));
});

/**
 * PUT/PATCH - Update an Event (EVENT_UPDATE)
 */
export const update_event = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'Event ID parameter is required');

  // Validate partial request body using Zod
  const parseResult = updateEventSchema.safeParse(req.body);
  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const updateData: UpdateEventBody = parseResult.data;

  // Update the event only if it belongs to this tenant organization
  const updatedEvent = await EventModel.findOneAndUpdate(
    {
      _id: id,
      organization: req.tenantContext!.organizationId,
      archived: false,
    },
    { $set: updateData },
    { new: true, runValidators: true },
  ).exec();

  appAssert(
    updatedEvent !== null,
    NOT_FOUND,
    'Event not found or access denied',
  );

  res.json(
    new CustomResponse(true, updatedEvent, 'Event updated successfully'),
  );
});

/**
 * DELETE - Soft Delete/Archive an Event (EVENT_DELETE)
 */
export const delete_event = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'Event ID parameter is required');

  // Perform a soft delete (archive) to retain records while keeping multi-tenancy safe
  const archivedEvent = await EventModel.findOneAndUpdate(
    {
      _id: id,
      organization: req.tenantContext!.organizationId,
      archived: false,
    },
    { $set: { archived: true } },
    { new: true },
  ).exec();

  appAssert(
    archivedEvent !== null,
    NOT_FOUND,
    'Event not found or access denied',
  );

  res.json(new CustomResponse(true, null, 'Event deleted successfully'));
});
