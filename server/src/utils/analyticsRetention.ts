// Path: src/utils/analyticsRetention.ts
// Purpose: Scheduled cleanup of analytics data older than RETENTION_DAYS
// Dependencies: analytics.model, env config

import { AnalyticsEvent } from '../models/analytics.model.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const RETENTION_DAYS = env.ANALYTICS_RETENTION_DAYS || 90;

export async function runRetentionCleanup(): Promise<{ deleted: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  try {
    const result = await AnalyticsEvent.deleteMany({ createdAt: { $lt: cutoff } });
    logger.info(`[Analytics] Retention cleanup: deleted ${result.deletedCount} events older than ${RETENTION_DAYS} days`);
    return { deleted: result.deletedCount };
  } catch (err) {
    logger.error('[Analytics] Retention cleanup failed:', { error: err });
    return { deleted: 0 };
  }
}
