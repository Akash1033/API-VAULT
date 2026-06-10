// Path: src/hooks/useAnalyticsStream.ts
// Purpose: SSE consumer hook for real-time live analytics updates on admin dashboard
// Dependencies: react, zustand (authStore), analytics types

import { useState, useEffect, useRef, useCallback } from 'react';
import type { LiveStats } from '../types/analytics';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface StreamState {
  readonly data: LiveStats | null;
  readonly connected: boolean;
  readonly error: string | null;
  readonly reconnectCount: number;
}

/**
 * Connects to the SSE stream at /api/v1/analytics/stream for real-time live stats.
 * Auto-reconnects with exponential backoff on disconnect.
 *
 * Because EventSource doesn't support custom Authorization headers,
 * the access token is passed as a query parameter. The backend validates it inline
 * before establishing the SSE connection.
 */
export function useAnalyticsStream(enabled = true) {
  const [state, setState] = useState<StreamState>({
    data: null,
    connected: false,
    error: null,
    reconnectCount: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const connectRef = useRef<() => void>(() => {});
  const accessToken = useAuthStore((s) => s.accessToken);

  const connect = useCallback(() => {
    if (!enabled || !accessToken) return;

    // EventSource doesn't support custom headers — pass token as query param
    const url = `${API_URL}/api/v1/analytics/stream?token=${encodeURIComponent(accessToken)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, connected: true, error: null }));
      reconnectCountRef.current = 0;
    };

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const live = JSON.parse(event.data) as LiveStats;
        setState((prev) => ({ ...prev, data: live, connected: true, error: null }));
      } catch {
        // Malformed data — ignore silently
      }
    };

    es.addEventListener('error', () => {
      es.close();
      eventSourceRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));

      // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(2000 * Math.pow(2, reconnectCountRef.current), 30000);
      reconnectCountRef.current += 1;

      setState((prev) => ({
        ...prev,
        reconnectCount: reconnectCountRef.current,
        error: `Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`,
      }));

      reconnectTimerRef.current = setTimeout(() => {
        connectRef.current();
      }, delay);
    });
  }, [enabled, accessToken]);

  // Keep the ref in sync with the latest connect function
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setState((prev) => ({ ...prev, connected: false }));
  }, []);

  return { ...state, disconnect };
}
