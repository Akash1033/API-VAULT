// Path: src/hooks/usePageTracker.ts
// Purpose: Automatically tracks page views on every route change — place ONCE in App wrapper
// Dependencies: react, react-router-dom, analytics utility

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../utils/analytics';

/**
 * Tracks page views on every route change.
 * Place this hook ONCE inside a component that has Router context (e.g. AppInner).
 *
 * On route enter: fires a page_view event.
 * On route leave: fires a duration event if the user stayed > 2 seconds.
 */
export function usePageTracker(): void {
  const location = useLocation();
  const enteredAt = useRef<number>(0);

  useEffect(() => {
    // Skip admin routes entirely — we only track public visitor behavior
    if (location.pathname.startsWith('/admin')) return;

    const start = Date.now();
    enteredAt.current = start;

    // Track page view on enter
    void trackEvent({
      type: 'page_view',
      path: location.pathname,
      referrer: document.referrer || undefined,
    });

    // Track duration when leaving the page
    return () => {
      const duration = Date.now() - start;
      // Only track if stayed more than 2 seconds (ignore bounces and rapid nav)
      if (duration > 2000) {
        void trackEvent({
          type: 'page_view',
          path: location.pathname,
          duration,
        });
      }
    };
  }, [location.pathname]);
}
