import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import EventSessionModel from '../models/event-session.model';
import EventModel from '../models/event.model';
import CustomResponse from '../types/response';
import {
  CreateEventSessionBody,
  createEventSessionSchema,
  UpdateEventSessionBody,
  updateEventSessionSchema,
  updateEventSessionStatusSchema,
} from '../middlewares/validations/event-session.validation';

/**
 * POST - Create an Event Session (EVENT_CREATE)
 */
export const create_event_session = asyncHandler(async (req, res) => {
  const parseResult = createEventSessionSchema.safeParse(req.body);

  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const { name, event }: CreateEventSessionBody = parseResult.data;

  // Verify the event belongs to this tenant and is not archived
  const parentEvent = await EventModel.findOne({
    _id: event,
    organization: req.tenantContext!.organizationId,
    archived: false,
  }).exec();

  appAssert(parentEvent !== null, NOT_FOUND, 'Parent event not found');

  // Check for duplicate session name in the same event
  const existingSession = await EventSessionModel.findOne({
    name,
    event,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(
    existingSession === null,
    CONFLICT,
    `A session named "${name}" already exists for this event`,
  );

  const session = new EventSessionModel({
    name,
    event,
    organization: req.tenantContext!.organizationId,
    status: 'upcoming',
  });

  await session.save();

  res.json(
    new CustomResponse(true, session, 'Event session created successfully'),
  );
});

/**
 * GET - Read All Sessions for an Event (EVENT_READ)
 */
export const get_event_sessions = asyncHandler(async (req, res) => {
  const { event } = req.query;
  appAssert(event, BAD_REQUEST, 'Event ID query parameter is required');

  const sessions = await EventSessionModel.find({
    event: event as string,
    organization: req.tenantContext!.organizationId,
  })
    .sort({ createdAt: 1 })
    .populate({
      model: EventModel,
      path: 'event',
    })
    .exec();

  res.json(
    new CustomResponse(true, sessions, 'Event sessions retrieved successfully'),
  );
});

/**
 * PUT/PATCH - Update an Event Session (EVENT_UPDATE)
 */
export const update_event_session = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'Session ID parameter is required');

  const parseResult = updateEventSessionSchema.safeParse(req.body);
  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const updateData: UpdateEventSessionBody = parseResult.data;

  const updatedSession = await EventSessionModel.findOneAndUpdate(
    {
      _id: id,
      organization: req.tenantContext!.organizationId,
    },
    { $set: updateData },
    { new: true, runValidators: true },
  ).exec();

  appAssert(
    updatedSession !== null,
    NOT_FOUND,
    'Session not found or access denied',
  );

  res.json(
    new CustomResponse(
      true,
      updatedSession,
      'Event session updated successfully',
    ),
  );
});

/**
 * DELETE - Delete an Event Session (EVENT_DELETE)
 */
export const delete_event_session = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'Session ID parameter is required');

  // Hard delete is okay for sessions since they might just be mistakes if not active yet.
  // We can just use findOneAndDelete. If we want soft delete later, we can change the model.
  const deletedSession = await EventSessionModel.findOneAndDelete({
    _id: id,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(
    deletedSession !== null,
    NOT_FOUND,
    'Session not found or access denied',
  );

  res.json(
    new CustomResponse(true, null, 'Event session deleted successfully'),
  );
});

/**
 * PATCH - Update Event Session Status (EVENT_UPDATE)
 */
export const update_event_session_status = asyncHandler(async (req, res) => {
  const { id } = req.params;
  appAssert(id, BAD_REQUEST, 'Session ID parameter is required');

  const parseResult = updateEventSessionStatusSchema.safeParse(req.body);
  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid status data',
  );

  const { status } = parseResult.data;

  // First fetch the session to know its current state
  const session = await EventSessionModel.findOne({
    _id: id,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(session !== null, NOT_FOUND, 'Session not found or access denied');

  // If changing to active and hasn't started yet, set startedAt
  if (status === 'active' && session.status === 'upcoming') {
    session.startedAt = new Date();
  } else if (status === 'paused' && session.status === 'active') {
    session.pausedAt = new Date();
  } else if (status === 'active' && session.status === 'paused') {
    // resuming
  } else if (status === 'completed' && session.status !== 'completed') {
    session.endedAt = new Date();
  }

  session.status = status;
  await session.save();

  res.json(
    new CustomResponse(
      true,
      session,
      'Event session status updated successfully',
    ),
  );
});
