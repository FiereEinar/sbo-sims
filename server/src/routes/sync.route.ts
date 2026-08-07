import express from 'express';
import {
  sync_health,
  sync_get_pending_ops,
  sync_mark_in_flight,
  sync_mark_synced,
  sync_get_checkpoint,
  sync_update_checkpoint,
  sync_apply_change,
  sync_current_seq,
  sync_bootstrap,
  sync_user_bootstrap,
  sync_apply_bootstrap_batch,
  sync_push,
  sync_pull,
} from '../controllers/sync.controller';
import { auth } from '../middlewares/authentication/auth';

const router = express.Router();

/**
 * GET /sync/health
 * Liveness check + server timestamp for clock-skew detection.
 * No authentication required — the sync engine needs to call this before login.
 */
router.get('/health', sync_health);

// ─── Local-only endpoints (Electron sync engine ↔ local Express) ─────────────
// These are called by sync-engine.js on localhost. They read/write local MongoDB.

router.get('/bootstrap', sync_bootstrap);

router.get('/user-bootstrap', sync_user_bootstrap);

router.post('/apply-bootstrap-batch', sync_apply_bootstrap_batch);

router.post('/push', sync_push);

router.get('/pull', sync_pull);

/** GET /sync/pending-ops — fetch next batch of unsynced ops for push */
router.get('/pending-ops', auth, sync_get_pending_ops);

/** PATCH /sync/mark-in-flight — mark a batch as in_flight before push attempt */
router.patch('/mark-in-flight', auth, sync_mark_in_flight);

/** PATCH /sync/mark-synced — mark a batch as synced after Atlas confirms */
router.patch('/mark-synced', auth, sync_mark_synced);

/** GET /sync/checkpoint — read the local sync cursor */
router.get('/checkpoint', auth, sync_get_checkpoint);

/** PATCH /sync/checkpoint — advance the local sync cursor */
router.patch('/checkpoint', auth, sync_update_checkpoint);

/** POST /sync/apply-change — apply one pulled Atlas change to local DB */
router.post('/apply-change', auth, sync_apply_change);

// ─── Bootstrap endpoints (Atlas-side, post-auth) ──────────────────────────────

/**
 * GET /sync/current-seq
 * Returns the current Atlas change log sequence counter.
 * Called at end of bootstrap to anchor lastPulledSeq.
 */
router.get('/current-seq', auth, sync_current_seq);

export default router;
