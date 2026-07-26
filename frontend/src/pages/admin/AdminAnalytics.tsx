// Path: src/pages/admin/AdminAnalytics.tsx
// Purpose: Real-time analytics dashboard — SSE-powered live stats, aggregated metrics, Recharts visualizations
// Dependencies: react, recharts, date-fns, tanstack-query, useAnalyticsStream, analytics API/types

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { useAnalyticsStream } from '../../hooks/useAnalyticsStream';
import { getAnalyticsStats } from '../../api/analytics';
import type { StatsResult, LiveStats } from '../../types/analytics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Animated number that flashes green on change
const AnimatedValue: React.FC<{
  value: number;
  colorWhen?: 'positive' | 'always';
  color?: string;
}> = ({ value, colorWhen, color }) => {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 400);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const shouldColor =
    colorWhen === 'always' ||
    (colorWhen === 'positive' && value > 0);

  return (
    <span
      className="font-mono text-[18px] font-medium transition-all duration-300"
      style={{
        color: shouldColor && color ? color : 'var(--text-primary)',
        transform: flash ? 'scale(1.15)' : 'scale(1)',
        display: 'inline-block',
      }}
    >
      {formatNumber(value)}
    </span>
  );
};

// Skeleton shimmer block
const Skeleton: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = '80px',
  height = '36px',
  className = '',
}) => (
  <div
    className={`relative overflow-hidden rounded-[4px] skeleton-shimmer ${className}`}
    style={{ width, height, background: 'var(--bg-raised)' }}
  />
);

// Stat card with optional comparison
const StatCard: React.FC<{
  label: string;
  value: number | undefined;
  prevValue?: number;
  footer: string;
  isLoading: boolean;
  withComparison: boolean;
}> = ({ label, value, prevValue, footer, isLoading, withComparison }) => {
  const pct = prevValue !== undefined && value !== undefined ? percentChange(value, prevValue) : null;

  return (
    <div className="bg-bgSurface border border-border rounded-[8px] p-[20px] flex flex-col gap-[8px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-[8px]">
          <span className="font-mono text-[11px] text-textMuted">{label}</span>
          <span className="font-mono text-[9px] px-[8px] py-[2px] rounded-[12px] bg-[rgba(74,222,128,0.12)] text-green">
            GET
          </span>
        </div>
      </div>

      {isLoading ? (
        <Skeleton width="80px" height="36px" />
      ) : (
        <div className="font-sans text-[36px] font-medium text-textPrimary leading-none">
          {formatNumber(value ?? 0)}
        </div>
      )}

      {withComparison && pct !== null && !isLoading && (
        <div className="flex flex-col gap-[2px]">
          <span
            className="font-mono text-[11px] inline-flex items-center gap-[4px] w-fit px-[8px] py-[2px] rounded-[3px]"
            style={{
              color:
                pct > 0 ? 'var(--green)' : pct < 0 ? 'var(--red)' : 'var(--text-muted)',
              background:
                pct > 0
                  ? 'rgba(74,222,128,0.08)'
                  : pct < 0
                    ? 'rgba(248,113,113,0.08)'
                    : 'rgba(255,255,255,0.04)',
              border: `1px solid ${pct > 0 ? 'rgba(74,222,128,0.2)' : pct < 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {pct > 0 ? '↑' : pct < 0 ? '↓' : '→'} {pct === 0 ? 'no change' : `${Math.abs(pct)}%`}
          </span>
          <span className="font-mono text-[10px] text-textMuted">vs previous period</span>
        </div>
      )}

      <div className="font-mono text-[10px] text-textMuted mt-auto">{footer}</div>
    </div>
  );
};

// Toggle switch
const ToggleSwitch: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-[8px] cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className="relative w-[32px] h-[16px] rounded-full transition-colors duration-200"
      style={{ background: checked ? 'var(--green)' : 'var(--bg-raised)', border: '1px solid var(--border)' }}
    >
      <div
        className="absolute top-[2px] w-[10px] h-[10px] rounded-full transition-all duration-200"
        style={{
          left: checked ? '18px' : '3px',
          background: checked ? 'var(--bg-base)' : 'var(--text-muted)',
        }}
      />
    </div>
    <span className="font-mono text-[11px] text-textMuted">{label}</span>
  </label>
);

// Recharts tooltip styling
const chartTooltipStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  color: 'var(--text-primary)',
};

// ─── Main page ────────────────────────────────────────────────────────────────

export const AdminAnalytics: React.FC = () => {
  // SSE live stats
  const { data: liveStats, connected, error: streamError } = useAnalyticsStream(true);

  // Time-ago updater
  const [timeAgo, setTimeAgo] = useState('');
  useEffect(() => {
    if (!liveStats?.updatedAt) return;
    const update = () => setTimeAgo(formatDistanceToNowStrict(new Date(liveStats.updatedAt), { addSuffix: true }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [liveStats?.updatedAt]);

  // Stats query state
  const [preset, setPreset] = useState<'7d' | '30d' | 'all' | 'custom'>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [withComparison, setWithComparison] = useState(false);

  const queryParams = {
    preset: preset === 'custom' ? undefined : preset,
    from: preset === 'custom' ? customFrom : undefined,
    to: preset === 'custom' ? customTo : undefined,
    compare: withComparison,
  };

  const { data: statsData, isLoading, refetch, isError } = useQuery({
    queryKey: ['analytics-stats', preset, customFrom, customTo, withComparison],
    queryFn: () => getAnalyticsStats(queryParams),
    enabled: preset !== 'custom' || (!!customFrom && !!customTo),
    staleTime: 30 * 1000,
  });

  const stats = statsData?.data?.stats as StatsResult | undefined;

  // Check if all values are 0 (empty state)
  const isEmpty =
    stats &&
    stats.totalVisitors === 0 &&
    stats.uniqueVisitors === 0 &&
    stats.resumeClicks === 0 &&
    stats.projectViews === 0 &&
    stats.apiRequests === 0 &&
    stats.contactForms === 0;

  // Date formatter for chart
  const formatDate = useCallback((d: string) => {
    try {
      return format(new Date(d), 'MMM d');
    } catch {
      return d;
    }
  }, []);

  const formatHour = useCallback((h: number) => `${h}h`, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /admin/analytics &rarr; 200 OK</div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Analytics</h1>
        </div>
      </div>

      {/* ─── SECTION 1: Live Stats Bar ─────────────────────────── */}
      <LiveStatsBar
        liveStats={liveStats}
        connected={connected}
        streamError={streamError}
        timeAgo={timeAgo}
      />

      {/* ─── SECTION 2: Date Range Selector ────────────────────── */}
      <div className="flex flex-wrap items-center gap-[12px] mb-[24px]">
        {/* Preset pills */}
        <div className="flex gap-[6px]">
          {(['7d', '30d', 'all', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`font-mono text-[11px] px-[12px] py-[5px] rounded-[4px] border cursor-pointer transition-colors ${
                preset === p
                  ? 'bg-[rgba(251,191,36,0.12)] border-[rgba(251,191,36,0.3)] text-amber'
                  : 'bg-transparent border-border text-textMuted hover:border-borderHover hover:text-textPrimary'
              }`}
            >
              {p === 'all' ? 'All time' : p === 'custom' ? 'Custom' : p}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {preset === 'custom' && (
          <div className="flex items-center gap-[8px]">
            <span className="font-mono text-[11px] text-textMuted">from:</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-bgRaised border border-border rounded-[4px] font-mono text-[11px] text-textPrimary px-[8px] py-[4px] outline-none focus:border-green"
            />
            <span className="font-mono text-[11px] text-textMuted">to:</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-bgRaised border border-border rounded-[4px] font-mono text-[11px] text-textPrimary px-[8px] py-[4px] outline-none focus:border-green"
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Compare toggle */}
        <ToggleSwitch
          label="Compare to previous period"
          checked={withComparison}
          onChange={setWithComparison}
        />
      </div>

      {/* ─── ERROR STATE ───────────────────────────────────────── */}
      {isError && (
        <div className="bg-bgSurface border border-border rounded-[8px] p-[24px] mb-[28px] font-mono text-[12px] leading-[1.9]">
          <div className="text-textMuted">{'{'}</div>
          <div className="pl-4">
            <span className="text-blue">"error"</span>
            <span className="text-textMuted">: </span>
            <span className="text-red">"Failed to fetch analytics"</span>
            <span className="text-textMuted">,</span>
          </div>
          <div className="pl-4">
            <span className="text-blue">"status"</span>
            <span className="text-textMuted">: </span>
            <span className="text-purple">500</span>
          </div>
          <div className="text-textMuted">{'}'}</div>
          <button
            onClick={() => void refetch()}
            className="mt-[12px] font-mono text-[11px] px-[16px] py-[6px] bg-transparent border border-green text-green rounded-[4px] cursor-pointer hover:bg-[rgba(74,222,128,0.08)] transition-colors"
          >
            Retry &rarr;
          </button>
        </div>
      )}

      {/* ─── EMPTY STATE ───────────────────────────────────────── */}
      {isEmpty && !isLoading && (
        <div className="bg-bgSurface border border-border rounded-[8px] p-[60px_24px] text-center mb-[28px]">
          <div className="inline-block text-left font-mono text-[12px] leading-[1.9]">
            <div className="text-textMuted">{'{'}</div>
            <div className="pl-4">
              <span className="text-blue">"success"</span>
              <span className="text-textMuted">: </span>
              <span className="text-green">true</span>
              <span className="text-textMuted">,</span>
            </div>
            <div className="pl-4">
              <span className="text-blue">"message"</span>
              <span className="text-textMuted">: </span>
              <span className="text-amber">"No analytics data yet."</span>
              <span className="text-textMuted">,</span>
            </div>
            <div className="pl-4">
              <span className="text-blue">"hint"</span>
              <span className="text-textMuted">: </span>
              <span className="text-amber">"Visit your portfolio to generate the first event."</span>
            </div>
            <div className="text-textMuted">{'}'}</div>
          </div>
        </div>
      )}

      {/* ─── SECTION 3: Stat Cards Grid ────────────────────────── */}
      {!isEmpty && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] mb-[28px]">
            <StatCard
              label="Total Visitors"
              value={stats?.totalVisitors}
              prevValue={stats?.comparisonPeriod?.totalVisitors}
              footer="// page_view events"
              isLoading={isLoading}
              withComparison={withComparison}
            />
            <StatCard
              label="Unique Visitors"
              value={stats?.uniqueVisitors}
              footer="// unique session IDs"
              isLoading={isLoading}
              withComparison={false}
            />
            <StatCard
              label="Resume Clicks"
              value={stats?.resumeClicks}
              prevValue={stats?.comparisonPeriod?.resumeClicks}
              footer="// resume_click events"
              isLoading={isLoading}
              withComparison={withComparison}
            />
            <StatCard
              label="Project Views"
              value={stats?.projectViews}
              prevValue={stats?.comparisonPeriod?.projectViews}
              footer="// project_view events"
              isLoading={isLoading}
              withComparison={withComparison}
            />
            <StatCard
              label="API Requests"
              value={stats?.apiRequests}
              prevValue={stats?.comparisonPeriod?.apiRequests}
              footer="// api_request events"
              isLoading={isLoading}
              withComparison={withComparison}
            />
            <StatCard
              label="Contact Forms"
              value={stats?.contactForms}
              footer="// contact_form events"
              isLoading={isLoading}
              withComparison={false}
            />
          </div>

          {/* ─── SECTION 4: Charts ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[16px]">
            {/* Chart A — Visitors by Day */}
            <div className="bg-bgSurface border border-border rounded-[8px] p-[20px]">
              <div className="font-mono text-[11px] text-textMuted mb-[16px]">
                // visitors_by_day
              </div>
              {isLoading ? (
                <Skeleton width="100%" height="200px" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart
                    data={stats?.visitorsByDay ?? []}
                    margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                  >
                    <defs>
                      <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      labelFormatter={(label: unknown) => {
                        try {
                          return format(new Date(label as string | number), 'MMM d, yyyy');
                        } catch {
                          return String(label);
                        }
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--green)"
                      strokeWidth={1.5}
                      fill="url(#visitorGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--green)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Right column — Charts B + C stacked */}
            <div className="flex flex-col gap-[16px]">
              {/* Chart B — Requests by Hour */}
              <div className="bg-bgSurface border border-border rounded-[8px] p-[20px]">
                <div className="font-mono text-[11px] text-textMuted mb-[12px]">
                  // api_requests_by_hour
                </div>
                {isLoading ? (
                  <Skeleton width="100%" height="140px" />
                ) : (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart
                      data={stats?.requestsByHour ?? []}
                      margin={{ top: 5, right: 5, bottom: 0, left: -30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={formatHour}
                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: "'IBM Plex Mono', monospace" }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: "'IBM Plex Mono', monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="count" fill="var(--blue)" radius={[2, 2, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Chart C — Top Projects */}
              <div className="bg-bgSurface border border-border rounded-[8px] p-[20px]">
                <div className="font-mono text-[11px] text-textMuted mb-[12px]">
                  // top_projects
                </div>
                {isLoading ? (
                  <div className="flex flex-col gap-[12px]">
                    <Skeleton width="100%" height="24px" />
                    <Skeleton width="100%" height="24px" />
                    <Skeleton width="100%" height="24px" />
                  </div>
                ) : stats?.topProjects && stats.topProjects.length > 0 ? (
                  <div className="flex flex-col gap-[10px]">
                    {stats.topProjects.map((p, i) => {
                      const maxViews = stats.topProjects[0].views;
                      const barWidth = maxViews > 0 ? (p.views / maxViews) * 100 : 0;
                      return (
                        <div key={p.slug}>
                          <div className="flex justify-between mb-[4px]">
                            <span className="font-mono text-[11px] text-textSecondary">
                              {i + 1}. {p.slug}
                            </span>
                            <span className="font-mono text-[11px] text-textMuted">
                              {p.views} views
                            </span>
                          </div>
                          <div
                            className="h-[4px] rounded-[2px]"
                            style={{ background: 'rgba(255,255,255,0.06)' }}
                          >
                            <div
                              className="h-full rounded-[2px] transition-all duration-700 ease-out"
                              style={{
                                width: `${barWidth}%`,
                                background: 'var(--amber)',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-textMuted py-[16px] text-center">
                    No project views yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Live Stats Bar (extracted for readability) ───────────────────────────────

const LiveStatsBar: React.FC<{
  liveStats: LiveStats | null;
  connected: boolean;
  streamError: string | null;
  timeAgo: string;
}> = ({ liveStats, connected, streamError, timeAgo }) => (
  <div className="bg-bgSurface border border-border rounded-[8px] px-[24px] py-[16px] mb-[28px] flex items-center justify-between flex-wrap gap-[16px]">
    {/* Connection status */}
    <div className="flex items-center gap-[8px]">
      <span
        className="inline-block w-[8px] h-[8px] rounded-full"
        style={{
          background: connected
            ? 'var(--green)'
            : streamError
              ? 'var(--red)'
              : 'var(--amber)',
          boxShadow: connected ? '0 0 6px var(--green)' : 'none',
          animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
        }}
      />
      <span
        className="font-mono text-[11px]"
        style={{
          color: connected ? 'var(--green)' : streamError ? 'var(--red)' : 'var(--amber)',
        }}
      >
        {connected ? '● live' : streamError ? 'disconnected' : 'reconnecting...'}
      </span>
      {connected && (
        <span className="font-mono text-[10px] text-textMuted">updates every 5s</span>
      )}
    </div>

    {/* Live metric pills */}
    <div className="flex gap-[12px] flex-wrap">
      <LivePill label="active now" value={liveStats?.activeVisitors ?? 0} colorWhen="positive" color="var(--green)" />
      <LivePill label="visitors today" value={liveStats?.totalVisitorsToday ?? 0} />
      <LivePill label="resume clicks" value={liveStats?.resumeClicksToday ?? 0} colorWhen="positive" color="var(--amber)" />
      <LivePill label="project views" value={liveStats?.projectViewsToday ?? 0} />
      <LivePill label="api req/hr" value={liveStats?.apiRequestsLastHour ?? 0} />
    </div>

    {/* Last updated */}
    {timeAgo && (
      <span className="font-mono text-[10px] text-textMuted">// {timeAgo}</span>
    )}
  </div>
);

const LivePill: React.FC<{
  label: string;
  value: number;
  colorWhen?: 'positive' | 'always';
  color?: string;
}> = ({ label, value, colorWhen, color }) => (
  <div className="bg-bgRaised border border-border rounded-[6px] px-[14px] py-[8px] flex flex-col items-center gap-[2px] min-w-[80px]">
    <span className="font-mono text-[9px] text-textMuted">{label}</span>
    <AnimatedValue value={value} colorWhen={colorWhen} color={color} />
  </div>
);

// Default export for lazy loading
export default AdminAnalytics;
