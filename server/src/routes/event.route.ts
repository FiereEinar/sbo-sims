import express from 'express';
import {
  create_event,
  get_all_events,
  get_single_event,
  update_event,
  delete_event,
} from '../controllers/event.controller';
import { hasRole } from '../middlewares/authentication/role';
import { MODULES } from '../constants/modules';

const router = express.Router();

/**
 * GET - Fetch all events for the tenant organization
 */
router.get('/', hasRole([MODULES.EVENT_READ]), get_all_events);

/**
 * GET - Fetch a single event by its ID
 */
router.get('/:id', hasRole([MODULES.EVENT_READ]), get_single_event);

/**
 * POST - Create a new event
 * Note: Zod schema parsing is handled directly inside the controller based on the previous step
 */
router.post('/', hasRole([MODULES.EVENT_CREATE]), create_event);

/**
 * PUT/PATCH - Update an event by its ID
 */
router.put('/:id', hasRole([MODULES.EVENT_UPDATE]), update_event);

/**
 * DELETE - Soft delete / archive an event by its ID
 */
router.delete('/:id', hasRole([MODULES.EVENT_DELETE]), delete_event);

export default router;
