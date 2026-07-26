// Path: src/middleware/maintenance.middleware.ts
// Purpose: Block public routes with 503 when maintenance mode is enabled
// Dependencies: settings.service

import type { Request, Response, NextFunction } from 'express';
import { getMaintenanceStatus } from '../services/settings.service.js';

// ---------------------------------------------------------------------------
// Routes that are EXCLUDED from the maintenance block.
// These must always remain accessible so the admin can log in and turn
// maintenance mode back off.
// ---------------------------------------------------------------------------

const EXCLUDED_PREFIXES: ReadonlyArray<string> = [
  // Auth — login, refresh, logout, me
  '/api/v1/auth',
  // Settings — the maintenance toggle itself
  '/api/v1/settings',
  // Dashboard — admin-only stats
  '/api/v1/dashboard',
  // Upload — admin-only image uploads
  '/api/v1/upload',
  // Health check (both mount points)
  '/api/v1/health',
  '/api/health',
];

const EXCLUDED_EXACT: ReadonlyArray<string> = [
  // Admin-only analytics endpoints (the public POST /track IS blocked)
  '/api/v1/analytics/stats',
  '/api/v1/analytics/live',
  '/api/v1/analytics/stream',
  // Admin-only payment endpoints (public order/verify/webhook/donor-wall ARE blocked)
  '/api/v1/payment/admin',
  '/api/v1/payment/stats',
];

const EXCLUDED_PATTERNS: ReadonlyArray<string> = [
  // Admin email resend: /api/v1/payment/resend-email/:id
  '/api/v1/payment/resend-email/',
];

/**
 * Check if the request path is excluded from maintenance mode blocking.
 */
function isExcluded(url: string): boolean {
  for (const prefix of EXCLUDED_PREFIXES) {
    if (url.startsWith(prefix)) return true;
  }
  for (const exact of EXCLUDED_EXACT) {
    if (url === exact || url.startsWith(exact + '?')) return true;
  }
  for (const pattern of EXCLUDED_PATTERNS) {
    if (url.startsWith(pattern)) return true;
  }
  return false;
}

/**
 * Maintenance mode middleware.
 *
 * Checks the in-memory-cached maintenance status (5s TTL, no DB hit on most
 * requests) and returns 503 for all public routes when maintenance is active.
 *
 * Admin routes, auth routes, health checks, and the settings endpoint itself
 * are explicitly excluded so the admin can always log in and turn maintenance
 * mode back off.
 */
export async function maintenanceCheck(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Skip excluded routes immediately — no DB/cache check needed
  if (isExcluded(req.originalUrl)) {
    next();
    return;
  }

  try {
    const status = await getMaintenanceStatus();

    if (status.maintenanceMode) {
      res.status(503).json({
        success: false,
        maintenance: true,
        message: status.maintenanceMessage,
      });
      return;
    }

    next();
  } catch {
    // If the cache/DB check fails, let the request through rather than
    // accidentally blocking the site due to a transient DB error.
    next();
  }
}
