// Path: src/types/analytics.ts
// Purpose: TypeScript interfaces for analytics data consumed by admin dashboard
// Dependencies: none

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
  readonly comparisonPeriod?: {
    readonly totalVisitors?: number;
    readonly resumeClicks?: number;
    readonly projectViews?: number;
    readonly apiRequests?: number;
  };
}

export interface LiveStats {
  readonly activeVisitors: number;
  readonly totalVisitorsToday: number;
  readonly resumeClicksToday: number;
  readonly projectViewsToday: number;
  readonly apiRequestsLastHour: number;
  readonly updatedAt: string;
}

export interface AnalyticsRange {
  readonly from: string;
  readonly to: string;
}

export type DatePreset = '7d' | '30d' | 'all';

export interface AnalyticsStatsResponse {
  readonly success: boolean;
  readonly statusCode: number;
  readonly message: string;
  readonly data: {
    readonly stats: StatsResult;
    readonly range: AnalyticsRange;
  };
}

export interface AnalyticsLiveResponse {
  readonly success: boolean;
  readonly statusCode: number;
  readonly message: string;
  readonly data: {
    readonly live: LiveStats;
  };
}
