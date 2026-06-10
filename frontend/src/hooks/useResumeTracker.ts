// Path: src/hooks/useResumeTracker.ts
// Purpose: Returns a callback to track resume download/view clicks for analytics
// Dependencies: react, analytics utility

import { useCallback } from 'react';
import { trackEvent } from '../utils/analytics';

/**
 * Returns a wrapped onClick handler that tracks resume clicks.
 * Fire-and-forget — the <a> href still works normally.
 */
export function useResumeTracker() {
  const trackResumeClick = useCallback(() => {
    void trackEvent({
      type: 'resume_click',
      path: '/resume',
    });
  }, []);

  return { trackResumeClick };
}
