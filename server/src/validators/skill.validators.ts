// Path: src/validators/skill.validators.ts
// Purpose: Zod validation schemas for skill create and update operations
// Dependencies: zod

import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(['frontend', 'backend', 'database', 'devops', 'tools', 'other'], {
    errorMap: () => ({ message: 'Invalid category. Must be: frontend, backend, database, devops, tools, or other' })
  }),
  proficiency: z.number().min(1).max(100),
  iconUrl: z.string().optional().default(''),
  displayOrder: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(false)
});

export const updateSkillSchema = createSkillSchema.partial();

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
