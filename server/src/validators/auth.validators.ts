// Path: src/validators/auth.validators.ts
// Purpose: Zod validation schemas for authentication endpoints
// Dependencies: zod

import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
    })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),

  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),

  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),

  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
