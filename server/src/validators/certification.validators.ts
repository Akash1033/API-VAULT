// Path: src/validators/certification.validators.ts
// Purpose: Zod validation schemas for certification CRUD
// Dependencies: zod

import { z } from 'zod';

export const createCertificationSchema = z.object({
  title: z.string().min(1).max(200),
  issuer: z.string().min(1).max(100),
  issueDate: z.string().min(1),
  expiryDate: z.string().nullable().optional(),
  credentialId: z.string().optional().default(''),
  credentialUrl: z.string().url().optional().or(z.literal('')).default(''),
  thumbnailUrl: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(false)
});

export const updateCertificationSchema = createCertificationSchema.partial();
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;
