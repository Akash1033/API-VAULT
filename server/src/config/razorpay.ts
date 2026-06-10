// Path: src/config/razorpay.ts
// Purpose: Razorpay SDK instance + HMAC-SHA256 signature verification for payments and webhooks
// Dependencies: razorpay, crypto, env config

import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { env } from './env.js';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

/**
 * Verify Razorpay HMAC-SHA256 signature for frontend payment callback.
 * Payload format: `orderId|paymentId` signed with key_secret.
 */
export function verifyPaymentSignature(params: {
  readonly orderId: string;
  readonly paymentId: string;
  readonly signature: string;
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(params.signature),
  );
}

/**
 * Verify Razorpay webhook HMAC-SHA256 signature.
 * Raw request body signed with webhook secret.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature),
  );
}
