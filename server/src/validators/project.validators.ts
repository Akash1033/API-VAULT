// Path: src/validators/project.validators.ts
// Purpose: Zod validation schemas for project create and update operations
// Dependencies: zod

import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  longDescription: z.string().optional().default(''),
  technologies: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  githubUrl: z.string().url().optional().or(z.literal('')).default(''),
  liveUrl: z.string().url().optional().or(z.literal('')).default(''),
  thumbnailUrl: z.string().optional().default(''),
  featured: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(false)
});

export const updateProjectSchema = createProjectSchema.partial();
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
