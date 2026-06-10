// Path: src/controllers/analytics.controller.ts
// Purpose: HTTP handlers for analytics tracking, stats retrieval, and SSE live stream
// Dependencies: analytics.service, catchAsync, ApiResponse, common.types, token.utils, auth.types

import type { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { HttpStatusCode } from '../types/common.types.js';
import { logger } from '../utils/logger.js';
import { verifyAccessToken } from '../utils/token.utils.js';
import { UserRole } from '../types/auth.types.js';
import type { TrackEventInput, StatsQueryInput } from '../validators/analytics.validators.js';

/**
 * POST /api/v1/analytics/track — PUBLIC
 * Called by frontend to record page_view, project_view, resume_click, contact_form.
 * Returns 202 Accepted immediately — tracking is fire-and-forget.
 */
/*
  PRIVACY COMPLIANCE NOTES:
  - Raw IP addresses are NEVER stored — only a short hash (first 16 hex chars of SHA-256)
  - The hash is one-way and cannot be reversed to recover the original IP
  - Session IDs are anonymous browser fingerprints, not linked to any user identity
  - No cookies are set by the analytics system
  - No personal data (name, email) is stored in analytics events
  - User agents are stored but excluded from API responses (select: false in model)
  - Data is auto-deleted after 90 days via MongoDB TTL index
  - GDPR: no consent required for anonymous, aggregated, non-personal analytics
  - If you add country tracking in future, store only 2-letter country code, never city/region
*/
export const trackEvent = catchAsync(async (req: Request, res: Response) => {
  const { type, path, resourceId, resourceSlug, sessionId, referrer, duration } =
    req.body as TrackEventInput;

  void analyticsService.track({
    type,
    path,
    resourceId,
    resourceSlug,
    sessionId,
    referrer,
    duration,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  ApiResponse.send(res, HttpStatusCode.ACCEPTED, 'Event accepted', null);
});

/**
 * GET /api/v1/analytics/stats — ADMIN ONLY
 * Returns aggregated analytics stats for a given date range.
 * Supports preset ranges (7d, 30d, all) or custom from/to dates.
 * Optionally includes comparison with previous equivalent period.
 */
export const getStats = catchAsync(async (req: Request, res: Response) => {
  const { preset, from, to, compare } = req.query as unknown as StatsQueryInput;

  const withComparison = compare === 'true';
  const range = analyticsService.getDateRange(preset ?? '7d', from, to);
  const stats = await analyticsService.getStats(range, withComparison);

  ApiResponse.ok(
    res,
    { stats, range: { from: range.from, to: range.to } },
    'Stats retrieved'
  );
});

/**
 * GET /api/v1/analytics/live — ADMIN ONLY
 * Returns current live stats snapshot (active visitors, today's metrics).
 */
export const getLiveStats = catchAsync(async (_req: Request, res: Response) => {
  const live = await analyticsService.getLiveStats();
  ApiResponse.ok(res, { live }, 'Live stats retrieved');
});

/**
 * GET /api/v1/analytics/stream — ADMIN ONLY — SSE endpoint
 * Pushes live stats to admin dashboard every 5 seconds via Server-Sent Events.
 * Includes heartbeat every 30s to keep connection alive through proxies.
 *
 * Auth is validated inline via query param because EventSource API
 * does not support custom Authorization headers. The token is verified
 * manually before establishing the SSE connection.
 */
export const streamLiveStats = async (req: Request, res: Response): Promise<void> => {
  // Validate token from query param (EventSource can't send Authorization header)
  const token = req.query.token as string | undefined;

  if (!token) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Access token is required',
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.role !== UserRole.ADMIN) {
      res.status(HttpStatusCode.FORBIDDEN).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }
  } catch {
    res.status(HttpStatusCode.UNAUTHORIZED).json({
      success: false,
      message: 'Access token is invalid or expired',
    });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  const sendData = async (): Promise<void> => {
    try {
      const live = await analyticsService.getLiveStats();
      res.write(`data: ${JSON.stringify(live)}\n\n`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stats';
      logger.error('[Analytics SSE] Error sending live stats', { error: message });
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to fetch stats' })}\n\n`);
    }
  };

  // Send initial data immediately
  await sendData();

  // Push every 5 seconds
  const interval = setInterval(() => {
    void sendData();
  }, 5000);

  // Heartbeat every 30s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    clearInterval(heartbeat);
    res.end();
  });
};
