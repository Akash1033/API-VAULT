// Path: src/validators/experience.validators.ts
// Purpose: Zod validation schemas for experience CRUD
// Dependencies: zod

import { z } from 'zod';

export const createExperienceSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  responsibilities: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().optional().nullable(),
  location: z.string().optional().default(''),
  type: z.enum(['full-time', 'part-time', 'freelance', 'internship', 'contract']).optional().default('full-time'),
  isPublished: z.boolean().optional().default(false)
});

export const updateExperienceSchema = createExperienceSchema.partial();
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
