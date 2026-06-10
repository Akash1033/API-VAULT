// Path: src/utils/analytics.ts
// Purpose: Anonymous session fingerprinting and fire-and-forget event tracking
// Dependencies: none (uses native fetch)

const STORAGE_KEY = 'portfolio_sid';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Generate a stable anonymous session ID stored in sessionStorage.
 * Combines browser properties — no cookies, no personal data.
 * The random component ensures uniqueness across sessions.
 */
export function getSessionId(): string {
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const fingerprint = [
    navigator.userAgent.slice(0, 50),
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
    Math.random().toString(36).slice(2),
  ].join('|');

  // Simple hash — not cryptographic, just for uniqueness
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  const sessionId = Math.abs(hash).toString(36) + Date.now().toString(36);
  sessionStorage.setItem(STORAGE_KEY, sessionId);
  return sessionId;
}

interface TrackEventPayload {
  readonly type: 'page_view' | 'project_view' | 'resume_click' | 'contact_form';
  readonly path: string;
  readonly resourceId?: string;
  readonly resourceSlug?: string;
  readonly referrer?: string;
  readonly duration?: number;
}

/** 
 * Fire-and-forget tracking function — NEVER throws, NEVER blocks the caller.
 * Errors are silently swallowed — tracking failure must never affect UX.
 * Uses `keepalive: true` so tracking completes even if the user navigates away.
 */
export async function trackEvent(payload: TrackEventPayload): Promise<void> {
  // Skip tracking in development mode
  if (import.meta.env.DEV) {
    console.debug('[Analytics] DEV — would track:', payload);
    return;
  }

  try {
    // Skip tracking on admin routes
    if (window.location.pathname.startsWith('/admin')) return;

    await fetch(`${API_URL}/api/v1/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
        referrer: document.referrer || undefined,
      }),
      keepalive: true,
    });
  } catch {
    // Silently swallow ALL errors — tracking failure must never affect UX
  }
}
