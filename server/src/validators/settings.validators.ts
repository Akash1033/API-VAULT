// Path: src/validators/settings.validators.ts
// Purpose: Zod validation schema for maintenance settings update
// Dependencies: zod

import { z } from 'zod';

export const updateMaintenanceSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z
    .string()
    .min(1, 'Message must not be empty')
    .max(500, 'Message must be at most 500 characters')
    .optional(),
});

export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
