// Path: src/routes/v1/payment.routes.ts
// Purpose: Payment route definitions — public order/verify/webhook/donor-wall + admin endpoints
// Dependencies: express, controllers, middleware (auth, validate, rateLimiter), validators

import { Router, type Request, type Response } from 'express';
import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getDonorWall,
  getAdminPayments,
  getRevenueStats,
  resendEmail,
} from '../../controllers/payment.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { globalLimiter } from '../../middleware/rateLimiter.js';
import { createOrderSchema, verifyPaymentSchema } from '../../validators/payment.validator.js';
import { paymentIdempotency } from '../../middleware/idempotency.middleware.js';
import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for payment creation — prevent abuse.
 * 10 payment attempts per IP per 15 minutes.
 */
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    errors: [
      {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many payment requests. Try again in 15 minutes.',
      },
    ],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to capture raw body for webhook HMAC signature verification.
 * CRITICAL: This is applied via express.json({ verify }) on the webhook route
 * so the raw body is preserved before JSON parsing.
 */
function captureRawBody(req: Request, _res: Response, buf: Buffer): void {
  req.rawBody = buf.toString('utf8');
}

const router = Router();

// ---------------------------------------------------------------------------
// PUBLIC routes
// ---------------------------------------------------------------------------

// Create a Razorpay order (with strict rate limiting)
router.post(
  '/order',
  paymentLimiter,
  paymentIdempotency,
  validateRequest({ body: createOrderSchema }),
  createOrder,
);

// Verify frontend payment callback (defence-in-depth)
router.post(
  '/verify',
  globalLimiter,
  validateRequest({ body: verifyPaymentSchema }),
  verifyPayment,
);

// Razorpay webhook — uses its own JSON parser to capture raw body
// NOTE: The global express.json() in app.ts skips this route
router.post(
  '/webhook',
  express.json({ verify: captureRawBody as (req: express.Request, res: express.Response, buf: Buffer, encoding: string) => void }),
  handleWebhook,
);

// Public donor wall
router.get('/donor-wall', globalLimiter, getDonorWall);

// ---------------------------------------------------------------------------
// ADMIN routes (require authentication + admin role)
// ---------------------------------------------------------------------------

router.get('/admin', globalLimiter, requireAuth, requireAdmin, getAdminPayments);
router.get('/stats', globalLimiter, requireAuth, requireAdmin, getRevenueStats);
router.post('/resend-email/:id', globalLimiter, requireAuth, requireAdmin, resendEmail);

export default router;
