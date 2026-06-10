// Path: src/validators/payment.validator.ts
// Purpose: Zod validation schemas for payment order creation and verification
// Dependencies: zod

import { z } from 'zod';

export const createOrderSchema = z.object({
  amountINR: z
    .number({ required_error: 'Amount is required' })
    .min(1, 'Minimum amount is ₹1')
    .max(50000, 'Maximum amount is ₹50,000'),
  donorName: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name cannot be empty')
    .max(100, 'Name too long')
    .trim(),
  donorEmail: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(254)
    .toLowerCase(),
  donorMessage: z
    .string()
    .max(500, 'Message too long')
    .trim()
    .optional(),
  donorSocialLink: z
    .string()
    .url('Invalid URL')
    .max(200)
    .optional()
    .or(z.literal('')),
  isAnonymous: z.boolean().optional().default(false),
  showOnWall: z.boolean().optional().default(true),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
