import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import SupportTicketModel from '../models/support-ticket.model';
import CustomResponse from '../types/response';
import { BAD_REQUEST, NOT_FOUND } from '../constants/http';
import OrganizationModel from '../models/organization.model';
import UserModel from '../models/user.model';

/**
 * POST - create a support ticket (Org Admin)
 */
export const create_ticket = asyncHandler(async (req, res) => {
  const { title, description, type } = req.body;

  appAssert(title, BAD_REQUEST, 'Title is required');
  appAssert(description, BAD_REQUEST, 'Description is required');
  appAssert(type, BAD_REQUEST, 'Type is required');

  const ticket = new SupportTicketModel({
    title,
    description,
    type,
    organization: req.tenantContext!.organizationId,
    submittedBy: req.currentUser!.id,
    status: 'OPEN',
  });

  await ticket.save();

  res.json(new CustomResponse(true, ticket, 'Ticket created successfully'));
});

/**
 * GET - fetch all tickets for an organization (Org Admin)
 */
export const get_org_tickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicketModel.find({
    organization: req.tenantContext!.organizationId,
  })
    .populate({
      model: UserModel,
      path: 'submittedBy',
      select: 'firstname lastname email',
    })
    .sort({ createdAt: -1 });

  res.json(new CustomResponse(true, tickets, 'Organization support tickets'));
});

/**
 * GET - fetch all tickets globally (Central Admin)
 */
export const get_admin_tickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicketModel.find({})
    .populate({
      model: OrganizationModel,
      path: 'organization',
    })
    .populate({
      model: UserModel,
      path: 'submittedBy',
      select: 'firstname lastname email',
    })
    .sort({ createdAt: -1 });

  res.json(new CustomResponse(true, tickets, 'All support tickets'));
});

/**
 * PATCH - update ticket status (Central Admin)
 */
export const update_ticket_status = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  appAssert(status, BAD_REQUEST, 'Status is required');
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  appAssert(validStatuses.includes(status), BAD_REQUEST, 'Invalid status');

  const ticket = await SupportTicketModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  appAssert(ticket, NOT_FOUND, `Ticket with ID ${id} not found`);

  res.json(new CustomResponse(true, ticket, 'Ticket status updated'));
});

/**
 * GET - fetch a single ticket (Org Admin)
 */
export const get_org_ticket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicketModel.findOne({
    _id: id,
    organization: req.tenantContext!.organizationId,
  })
    .populate({
      model: UserModel,
      path: 'submittedBy',
      select: 'firstname lastname email',
    })
    .populate({
      model: UserModel,
      path: 'replies.sender',
      select: 'firstname lastname email role',
    });

  appAssert(ticket, NOT_FOUND, `Ticket with ID ${id} not found`);
  res.json(new CustomResponse(true, ticket, 'Support ticket retrieved'));
});

/**
 * GET - fetch a single ticket (Central Admin)
 */
export const get_admin_ticket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicketModel.findById(id)
    .populate({
      model: OrganizationModel,
      path: 'organization',
    })
    .populate({
      model: UserModel,
      path: 'submittedBy',
      select: 'firstname lastname email',
    })
    .populate({
      model: UserModel,
      path: 'replies.sender',
      select: 'firstname lastname email role',
    });

  appAssert(ticket, NOT_FOUND, `Ticket with ID ${id} not found`);
  res.json(new CustomResponse(true, ticket, 'Support ticket retrieved'));
});

/**
 * POST - reply to a ticket (Org Admin)
 */
export const reply_ticket_org = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  appAssert(message, BAD_REQUEST, 'Message is required');

  const ticket = await SupportTicketModel.findOneAndUpdate(
    { _id: id, organization: req.tenantContext!.organizationId },
    {
      $push: {
        replies: {
          message,
          sender: req.currentUser!.id,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate({
    model: UserModel,
    path: 'replies.sender',
    select: 'firstname lastname email role',
  });

  appAssert(ticket, NOT_FOUND, `Ticket with ID ${id} not found`);
  res.json(new CustomResponse(true, ticket, 'Reply added successfully'));
});

/**
 * POST - reply to a ticket (Central Admin)
 */
export const reply_ticket_admin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  appAssert(message, BAD_REQUEST, 'Message is required');

  const ticket = await SupportTicketModel.findByIdAndUpdate(
    id,
    {
      $push: {
        replies: {
          message,
          sender: req.currentUser!.id,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate({
    model: UserModel,
    path: 'replies.sender',
    select: 'firstname lastname email role',
  });

  appAssert(ticket, NOT_FOUND, `Ticket with ID ${id} not found`);
  res.json(new CustomResponse(true, ticket, 'Reply added successfully'));
});
