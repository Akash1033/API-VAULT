// Path: src/hooks/useProjectTracker.ts
// Purpose: Returns a callback to track project card views/clicks for analytics
// Dependencies: react, analytics utility

import { useCallback } from 'react';
import { trackEvent } from '../utils/analytics';

interface TrackableProject {
  readonly _id: string;
  readonly slug: string;
  readonly title: string;
}

/**
 * Returns a function to call when a project card is viewed or clicked.
 * Fire-and-forget — never blocks navigation.
 */
export function useProjectTracker() {
  const trackProjectView = useCallback((project: TrackableProject) => {
    void trackEvent({
      type: 'project_view',
      path: `/projects/${project.slug}`,
      resourceId: project._id,
      resourceSlug: project.slug,
    });
  }, []);

  return { trackProjectView };
}
