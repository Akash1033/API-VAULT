// Path: src/routes/v1/analytics.routes.ts
// Purpose: Analytics route definitions — public tracking endpoint + admin-only stats/live/stream
// Dependencies: analytics.controller, auth.middleware, rateLimiter, validate, analytics.validators

import { Router } from 'express';
import {
  trackEvent,
  getStats,
  getLiveStats,
  streamLiveStats,
} from '../../controllers/analytics.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { trackEventSchema, statsQuerySchema } from '../../validators/analytics.validators.js';
import { globalLimiter } from '../../middleware/rateLimiter.js';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../../config/redis.js';

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute window
  max: 20,                        // max 20 track events per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis store so rate limit persists across server restarts
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
  }),
  message: {
    success: false,
    errors: [{ code: 'RATE_LIMIT', message: 'Slow down — too many tracking events.' }]
  },
  skip: (req) => {
    // Don't rate limit if it's coming from the same server (health checks etc.)
    return req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

const router = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
// Frontend sends tracking events here — no auth required
router.post(
  '/track',
  trackLimiter,
  validateRequest({ body: trackEventSchema }),
  trackEvent
);

// ─── Admin only ───────────────────────────────────────────────────────────────
// Aggregated stats with optional comparison period
router.get(
  '/stats',
  globalLimiter,
  requireAuth,
  requireAdmin,
  validateRequest({ query: statsQuerySchema }),
  getStats
);

// One-shot live stats snapshot
router.get(
  '/live',
  globalLimiter,
  requireAuth,
  requireAdmin,
  getLiveStats
);

// SSE stream — pushes live stats every 5 seconds
// Auth is handled inline in the controller via query param token validation
// because EventSource API cannot send custom Authorization headers.
// No rate limiter — it's a persistent connection.
router.get(
  '/stream',
  streamLiveStats
);

export default router;
