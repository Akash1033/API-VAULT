// Path: src/services/analytics.service.ts
// Purpose: All analytics aggregation logic — event tracking, stats computation, live stats, Redis caching
// Dependencies: analytics.model, redis config, env config, crypto, logger

import { AnalyticsEvent, type EventType } from '../models/analytics.model.js';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { isBot, isAdminPath } from '../utils/botDetector.js';
import crypto from 'node:crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

export interface StatsResult {
  readonly totalVisitors: number;
  readonly uniqueVisitors: number;
  readonly resumeClicks: number;
  readonly projectViews: number;
  readonly apiRequests: number;
  readonly contactForms: number;
  readonly topProjects: ReadonlyArray<{ slug: string; views: number }>;
  readonly visitorsByDay: ReadonlyArray<{ date: string; count: number }>;
  readonly requestsByHour: ReadonlyArray<{ hour: number; count: number }>;
  readonly comparisonPeriod?: Partial<StatsResult>;
}

export interface LiveStats {
  readonly activeVisitors: number;
  readonly totalVisitorsToday: number;
  readonly resumeClicksToday: number;
  readonly projectViewsToday: number;
  readonly apiRequestsLastHour: number;
  readonly updatedAt: string;
}

export interface TrackEventData {
  readonly type: EventType;
  readonly path: string;
  readonly resourceId?: string;
  readonly resourceSlug?: string;
  readonly sessionId?: string;
  readonly ip?: string;
  readonly referrer?: string;
  readonly userAgent?: string;
  readonly duration?: number;
}

type DatePreset = '7d' | '30d' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hashIP(ip: string): string {
  const salt = env.IP_HASH_SALT;
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .slice(0, 16);
}

function dateRangeForPreset(preset: DatePreset): DateRange {
  const to = new Date();
  const from = new Date();

  switch (preset) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case 'all':
      from.setFullYear(2020);
      break;
  }

  return { from, to };
}

function previousPeriod(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime()),
  };
}

// ─── Core aggregation functions ───────────────────────────────────────────────

async function countEvents(type: EventType, from: Date, to: Date): Promise<number> {
  return AnalyticsEvent.countDocuments({
    type,
    createdAt: { $gte: from, $lte: to },
  });
}

async function uniqueSessions(from: Date, to: Date): Promise<number> {
  const result: Array<{ total: number }> = await AnalyticsEvent.aggregate([
    { $match: { type: 'page_view', createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: '$sessionId' } },
    { $count: 'total' },
  ]);
  return result[0]?.total ?? 0;
}

async function topProjects(
  from: Date,
  to: Date,
  limit = 5
): Promise<Array<{ slug: string; views: number }>> {
  return AnalyticsEvent.aggregate([
    {
      $match: {
        type: 'project_view',
        resourceSlug: { $exists: true, $ne: null },
        createdAt: { $gte: from, $lte: to },
      },
    },
    { $group: { _id: '$resourceSlug', views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: limit },
    { $project: { _id: 0, slug: '$_id', views: 1 } },
  ]);
}

async function visitorsByDay(
  from: Date,
  to: Date
): Promise<Array<{ date: string; count: number }>> {
  return AnalyticsEvent.aggregate([
    { $match: { type: 'page_view', createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', count: 1 } },
  ]);
}

async function requestsByHour(
  from: Date,
  to: Date
): Promise<Array<{ hour: number; count: number }>> {
  return AnalyticsEvent.aggregate([
    { $match: { type: 'api_request', createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, hour: '$_id', count: 1 } },
  ]);
}

// ─── Public service methods ───────────────────────────────────────────────────

export const analyticsService = {
  /**
   * Record a single event — fire-and-forget, never throws to caller.
   * Tracking failure must not affect the main request pipeline.
   */
  async track(data: TrackEventData): Promise<void> {
    try {
      // Skip bots and admin paths
      if (isBot(data.userAgent)) return;
      if (isAdminPath(data.path)) return;

      const { ip, ...rest } = data;
      await AnalyticsEvent.create({
        ...rest,
        ipHash: ip ? hashIP(ip) : undefined,
        createdAt: new Date(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('[Analytics] Failed to track event', { error: message, type: data.type });
    }
  },

  /**
   * Get aggregated stats for a date range with Redis cache (30s TTL).
   * Runs all aggregation pipelines in parallel for speed.
   */
  async getStats(range: DateRange, withComparison = false): Promise<StatsResult> {
    const cacheKey = `analytics:stats:${range.from.toISOString()}:${range.to.toISOString()}:${String(withComparison)}`;

    // Try cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as StatsResult;
      }
    } catch {
      // Redis miss or parse error — compute fresh
    }

    // Compute all stats in parallel
    const [
      totalVisitors,
      uniqueV,
      resumeClicks,
      projectViews,
      apiRequests,
      contactForms,
      topP,
      byDay,
      byHour,
    ] = await Promise.all([
      countEvents('page_view', range.from, range.to),
      uniqueSessions(range.from, range.to),
      countEvents('resume_click', range.from, range.to),
      countEvents('project_view', range.from, range.to),
      countEvents('api_request', range.from, range.to),
      countEvents('contact_form', range.from, range.to),
      topProjects(range.from, range.to),
      visitorsByDay(range.from, range.to),
      requestsByHour(range.from, range.to),
    ]);

    const stats: StatsResult = {
      totalVisitors,
      uniqueVisitors: uniqueV,
      resumeClicks,
      projectViews,
      apiRequests,
      contactForms,
      topProjects: topP,
      visitorsByDay: byDay,
      requestsByHour: byHour,
    };

    // Comparison period (previous equivalent period)
    if (withComparison) {
      const prev = previousPeriod(range);
      const [prevVisitors, prevResume, prevProjects, prevApi] = await Promise.all([
        countEvents('page_view', prev.from, prev.to),
        countEvents('resume_click', prev.from, prev.to),
        countEvents('project_view', prev.from, prev.to),
        countEvents('api_request', prev.from, prev.to),
      ]);
      (stats as { comparisonPeriod?: Partial<StatsResult> }).comparisonPeriod = {
        totalVisitors: prevVisitors,
        resumeClicks: prevResume,
        projectViews: prevProjects,
        apiRequests: prevApi,
      };
    }

    // Cache for 30 seconds
    try {
      await redis.setex(cacheKey, 30, JSON.stringify(stats));
    } catch {
      // Cache write failure is non-fatal
    }

    return stats;
  },

  /**
   * Live stats — fast, used by SSE every 5 seconds.
   * Cached in Redis with 5s TTL to avoid hammering MongoDB.
   */
  async getLiveStats(): Promise<LiveStats> {
    const cacheKey = 'analytics:live';

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as LiveStats;
      }
    } catch {
      // proceed to compute
    }

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [activeResult, todayVisitors, todayResume, todayProjects, hourlyAPI] =
      await Promise.all([
        AnalyticsEvent.aggregate<{ total: number }>([
          { $match: { type: 'page_view', createdAt: { $gte: fiveMinAgo } } },
          { $group: { _id: '$sessionId' } },
          { $count: 'total' },
        ]),
        countEvents('page_view', startOfToday, now),
        countEvents('resume_click', startOfToday, now),
        countEvents('project_view', startOfToday, now),
        countEvents('api_request', oneHourAgo, now),
      ]);

    const live: LiveStats = {
      activeVisitors: activeResult[0]?.total ?? 0,
      totalVisitorsToday: todayVisitors,
      resumeClicksToday: todayResume,
      projectViewsToday: todayProjects,
      apiRequestsLastHour: hourlyAPI,
      updatedAt: new Date().toISOString(),
    };

    try {
      await redis.setex(cacheKey, 5, JSON.stringify(live));
    } catch {
      // non-fatal
    }

    return live;
  },

  /**
   * Resolve a date range from either a preset string or explicit from/to params.
   */
  getDateRange(preset: DatePreset, from?: string, to?: string): DateRange {
    if (from && to) {
      return { from: new Date(from), to: new Date(to) };
    }
    return dateRangeForPreset(preset);
  },
};
