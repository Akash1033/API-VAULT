// Path: src/validators/analytics.validators.ts
// Purpose: Zod schemas for analytics event tracking and stats query validation
// Dependencies: zod

import { z } from 'zod';

export const trackEventSchema = z.object({
  type: z.enum(['page_view', 'project_view', 'resume_click', 'contact_form'], {
    required_error: 'Event type is required',
    invalid_type_error: 'Invalid event type',
  }),
  path: z
    .string({ required_error: 'Path is required' })
    .min(1, 'Path cannot be empty')
    .max(500, 'Path cannot exceed 500 characters'),
  resourceId: z.string().max(50).optional(),
  resourceSlug: z
    .string()
    .max(200, 'Resource slug cannot exceed 200 characters')
    .optional(),
  sessionId: z.string().max(50).optional(),
  referrer: z.string().max(500).optional(),
  duration: z.number().int().nonnegative().optional(),
});

export const statsQuerySchema = z.object({
  preset: z.enum(['7d', '30d', 'all']).optional().default('7d'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  compare: z.enum(['true', 'false']).optional().default('false'),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
