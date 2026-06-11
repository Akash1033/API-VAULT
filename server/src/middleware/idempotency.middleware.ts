// Path: src/middleware/idempotency.middleware.ts
// Purpose: Prevent duplicate payment order creation (double-click protection)
// Dependencies: ioredis (via redis config)

import type { Request, Response, NextFunction } from 'express';
import { redis, isRedisAvailable } from '../config/redis.js';

/**
 * Idempotency guard for the payment order creation endpoint.
 *
 * Key = hash of (IP + donorEmail + amountINR + minute-window).
 * Same user, same amount, within 1 minute → 409 DUPLICATE_REQUEST.
 *
 * If Redis is unavailable, the middleware falls through silently —
 * the request is still protected by Razorpay's own idempotency on order_id.
 */
export async function paymentIdempotency(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Skip entirely if Redis is not available
  if (!isRedisAvailable()) {
    next();
    return;
  }

  try {
    const { donorEmail, amountINR } = req.body as {
      donorEmail?: string;
      amountINR?: number;
    };

    // If the required fields are missing, let validation middleware handle it
    if (!donorEmail || !amountINR) {
      next();
      return;
    }

    const minuteWindow = Math.floor(Date.now() / 60000);
    const key = `idempotency:payment:${req.ip}:${donorEmail}:${amountINR}:${minuteWindow}`;

    const existing = await redis!.get(key);
    if (existing) {
      res.status(409).json({
        success: false,
        errors: [
          {
            code: 'DUPLICATE_REQUEST',
            message:
              'A payment with this amount was just initiated. Please wait 1 minute before trying again.',
          },
        ],
      });
      return;
    }

    // Mark this combination as in-flight for 60 seconds
    await redis!.setex(key, 60, '1');
    next();
  } catch {
    // Redis failure — allow request through (non-blocking).
    // MongoDB + Razorpay order_id uniqueness is the ultimate guard.
    next();
  }
}
