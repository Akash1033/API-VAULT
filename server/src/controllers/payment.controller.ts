// Path: src/controllers/payment.controller.ts
// Purpose: HTTP handlers for payment routes — order creation, verification, webhook, donor wall, admin
// Dependencies: payment.service, razorpay config, catchAsync, ApiResponse, AppError

import type { Request, Response } from 'express';
import { paymentService } from '../services/payment.service.js';
import { emailService } from '../services/email.service.js';
import { verifyWebhookSignature } from '../config/razorpay.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import { HttpStatusCode, ErrorCode } from '../types/common.types.js';
import { logger } from '../utils/logger.js';
import { Payment } from '../models/payment.model.js';
import type { CreateOrderInput, VerifyPaymentInput } from '../validators/payment.validator.js';

/**
 * POST /api/v1/payment/order — PUBLIC
 * Creates a Razorpay order and returns checkout details to the frontend.
 */
export const createOrder = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as CreateOrderInput;

  const ipAddress = (
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();

  const userAgent = req.headers['user-agent'] ?? 'unknown';

  const result = await paymentService.createOrder({
    amountINR: data.amountINR,
    donorName: data.donorName,
    donorEmail: data.donorEmail,
    donorMessage: data.donorMessage,
    donorSocialLink: data.donorSocialLink,
    isAnonymous: data.isAnonymous,
    showOnWall: data.showOnWall,
    ip: ipAddress,
    userAgent,
  });

  ApiResponse.created(res, result, 'Order created');
});

/**
 * POST /api/v1/payment/verify — PUBLIC
 * Called by frontend after Razorpay checkout success.
 * Defence-in-depth signature check — webhook is the actual source of truth.
 */
export const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as VerifyPaymentInput;

  const result = await paymentService.verifyFrontendPayment({
    razorpayOrderId: data.razorpayOrderId,
    razorpayPaymentId: data.razorpayPaymentId,
    razorpaySignature: data.razorpaySignature,
  });

  ApiResponse.ok(res, result, 'Payment verified');
});

/**
 * POST /api/v1/payment/webhook — Razorpay webhook (raw body required)
 * SOURCE OF TRUTH for payment confirmation.
 * Responds 200 immediately, then processes asynchronously.
 * NOT wrapped in catchAsync — manual error handling to ensure 200 response.
 *
 * Security checks:
 *   1. Content-Type must be application/json
 *   2. x-razorpay-signature header must exist
 *   3. Raw body must be available (for HMAC check)
 *   4. HMAC-SHA256 signature must be valid
 *   5. Event type must be in our known-events list
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  // 1. Verify Content-Type — Razorpay always sends application/json
  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    logger.warn('Webhook rejected: invalid content type', { contentType, ip: req.ip });
    res.status(400).json({ success: false, message: 'Invalid content type' });
    return;
  }

  // 2. Verify signature header exists
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  if (!signature) {
    logger.warn('Webhook rejected: missing signature header', { ip: req.ip });
    res.status(400).json({ success: false, message: 'Missing signature' });
    return;
  }

  // 3. Verify raw body is available (required for signature check)
  const rawBody = req.rawBody;
  if (!rawBody) {
    logger.warn('Webhook rejected: empty body', { ip: req.ip });
    res.status(400).json({ success: false, message: 'Empty body' });
    return;
  }

  // 4. Verify HMAC-SHA256 signature
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    logger.error('Webhook INVALID SIGNATURE — possible replay attack', {
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    res.status(400).json({ success: false, message: 'Invalid signature' });
    return;
  }

  // 5. Verify event type is known — acknowledge unknown events without processing
  const knownEvents = ['payment.captured', 'payment.failed', 'order.paid'];
  const webhookEvent = (req.body as { event?: string }).event;
  if (!webhookEvent || !knownEvents.includes(webhookEvent)) {
    logger.info('Webhook unknown event type — acknowledged, not processed', {
      event: webhookEvent,
    });
    res.status(200).json({ success: true });
    return;
  }

  // Respond immediately — Razorpay requires 200 within 5 seconds
  res.status(200).json({ success: true });

  // Process the event asynchronously (after response is sent)
  try {
    await paymentService.processWebhook(req.body);
  } catch (err: unknown) {
    logger.error('Webhook processing error', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

/**
 * GET /api/v1/payment/donor-wall — PUBLIC
 * Returns captured payments where donors opted into the public wall.
 */
export const getDonorWall = catchAsync(async (_req: Request, res: Response) => {
  const donors = await paymentService.getDonorWall();
  ApiResponse.ok(res, { donors }, 'Donor wall retrieved');
});

/**
 * GET /api/v1/payment/admin — ADMIN ONLY
 * Paginated list of all payments with optional status filter.
 */
export const getAdminPayments = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const status = req.query['status'] as string | undefined;

  const result = await paymentService.getAllPayments({ status, page, limit });

  ApiResponse.paginated(
    res,
    result.payments,
    {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
    'Payments retrieved',
  );
});

/**
 * GET /api/v1/payment/stats — ADMIN ONLY
 * Revenue aggregation stats for the admin dashboard.
 */
export const getRevenueStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await paymentService.getRevenueStats();
  ApiResponse.ok(res, { stats }, 'Revenue stats retrieved');
});

/**
 * POST /api/v1/payment/resend-email/:id — ADMIN ONLY
 * Resend the thank-you email for a captured payment.
 */
export const resendEmail = catchAsync(async (req: Request, res: Response) => {
  const payment = await Payment.findById(req.params['id']);

  if (!payment || payment.status !== 'captured') {
    throw new AppError('Payment not found or not captured', HttpStatusCode.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  await emailService.sendThankYou({
    to: payment.donorEmail,
    name: payment.donorName,
    amountINR: payment.amountINR,
    message: payment.donorMessage,
    paymentId: payment.razorpayPaymentId ?? 'N/A',
  });

  await Payment.findByIdAndUpdate(payment._id, { emailSent: true });

  logger.info('Thank-you email resent', { paymentId: payment._id });

  ApiResponse.ok(res, null, 'Email resent');
});
