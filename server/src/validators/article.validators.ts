// Path: src/validators/article.validators.ts
// Purpose: Zod validation schemas for article CRUD
// Dependencies: zod

import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  coverImageUrl: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  readTimeMinutes: z.number().int().min(1).optional().default(1),
  isPublished: z.boolean().optional().default(false),
  publishedAt: z.string().nullable().optional()
});

export const updateArticleSchema = createArticleSchema.partial();
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
