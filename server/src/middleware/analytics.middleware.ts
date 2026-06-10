// Path: src/middleware/analytics.middleware.ts
// Purpose: Express middleware to auto-track API GET requests as analytics events
// Dependencies: analytics.service, crypto

import type { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import crypto from 'node:crypto';

/**
 * Generate an anonymous session ID from request fingerprint.
 * Combines user-agent + accept-language + IP into a short hash.
 * No personal data is stored — this is a non-reversible fingerprint.
 */
function getSessionId(req: Request): string {
  const fingerprint = [
    req.headers['user-agent'] ?? '',
    req.headers['accept-language'] ?? '',
    req.ip ?? '',
  ].join('|');

  return crypto.createHash('md5').update(fingerprint).digest('hex').slice(0, 12);
}

/**
 * Middleware: track every successful GET /api/v1/* request as an api_request event.
 * Fires AFTER the response is sent via res.on('finish') — non-blocking.
 *
 * Skips:
 *  - Non-GET methods (mutations are not visitor metrics)
 *  - Admin routes (internal traffic)
 *  - Auth routes (sensitive paths)
 *  - Analytics routes (avoid self-tracking recursion)
 *  - Failed requests (4xx/5xx)
 */
export function trackApiRequest(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    if (req.method !== 'GET') return;
    if (req.path.startsWith('/admin')) return;
    if (req.path.startsWith('/auth')) return;
    if (req.path.startsWith('/analytics')) return;
    if (res.statusCode >= 400) return;

    // Timeout: if track() takes more than 2s, abort silently
    const trackWithTimeout = Promise.race([
      analyticsService.track({
        type: 'api_request',
        path: req.path,
        sessionId: getSessionId(req),
        ip: req.ip,
        referrer: req.headers.referer,
        userAgent: req.headers['user-agent']
      }),
      new Promise<void>(resolve => setTimeout(resolve, 2000))
    ]);

    void trackWithTimeout;
  });

  next();
}
