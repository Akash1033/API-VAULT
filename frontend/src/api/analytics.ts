// Path: src/api/analytics.ts
// Purpose: Admin analytics API calls — stats retrieval and live snapshot
// Dependencies: axios instance, analytics types

import { api as axiosInstance } from './axios';
import type { AnalyticsStatsResponse, AnalyticsLiveResponse } from '../types/analytics';

interface StatsParams {
  readonly preset?: '7d' | '30d' | 'all';
  readonly from?: string;
  readonly to?: string;
  readonly compare?: boolean;
}

// ─── ANALYTICS ───────────────────────────────────────────

export const getAnalyticsStats = (params: StatsParams): Promise<AnalyticsStatsResponse> =>
  axiosInstance
    .get<AnalyticsStatsResponse>('/analytics/stats', {
      params: {
        preset: params.preset,
        from: params.from,
        to: params.to,
        compare: params.compare ? 'true' : undefined,
      },
    })
    .then((r) => r.data);

export const getLiveAnalytics = (): Promise<AnalyticsLiveResponse> =>
  axiosInstance.get<AnalyticsLiveResponse>('/analytics/live').then((r) => r.data);
