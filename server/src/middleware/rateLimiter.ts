// Path: src/middleware/rateLimiter.ts
// Purpose: Rate limiting middleware for login/register and general API protection
// Dependencies: express-rate-limit, env config

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { HttpStatusCode, ErrorCode } from '../types/common.types.js';

interface RateLimitErrorBody {
  readonly success: false;
  readonly statusCode: number;
  readonly message: string;
  readonly errorCode: string;
  readonly requestId?: string;
}

function createRateLimitResponse(req: Request, res: Response): void {
  const body: RateLimitErrorBody = {
    success: false,
    statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please try again later.',
    errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
    requestId: req.requestId,
  };

  res.status(HttpStatusCode.TOO_MANY_REQUESTS).json(body);
}

/**
 * Login/Register rate limiter: 5 attempts per IP per 15 minutes.
 * Protects against brute-force credential attacks.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'development' ? 500 : 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  keyGenerator: (req: Request): string => {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  },
  handler: (_req: Request, res: Response): void => {
    createRateLimitResponse(_req, res);
  },
  skipSuccessfulRequests: true,
});

/**
 * Register rate limiter: 10 attempts per IP per hour.
 * Protects against mass account creation.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.NODE_ENV === 'development' ? 500 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many registration attempts. Please try again after an hour.',
  keyGenerator: (req: Request): string => {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  },
  handler: (_req: Request, res: Response): void => {
    createRateLimitResponse(_req, res);
  },
  skipSuccessfulRequests: true,
});

/**
 * Global API rate limiter using env-configured values.
 * Applied broadly to all routes.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  },
  handler: (_req: Request, res: Response): void => {
    createRateLimitResponse(_req, res);
  },
});
