// Path: src/validators/contact.validator.ts
import { z } from 'zod';

export const createContactSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .max(254, 'Email cannot exceed 254 characters')
    .toLowerCase(),
  message: z
    .string({ required_error: 'Message is required' })
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim()
});

export const markAsReadSchema = z.object({});

export type CreateContactInput = z.infer<typeof createContactSchema>;
