// Path: src/services/payment.service.ts
// Purpose: Core payment business logic — order creation, verification, webhook processing, admin queries
// Dependencies: Payment model, razorpay config, email service, AppError, env config, crypto

import crypto from 'node:crypto';
import { Payment, type IPayment } from '../models/payment.model.js';
import { razorpay, verifyPaymentSignature } from '../config/razorpay.js';
import { emailService } from './email.service.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { redis, isRedisAvailable } from '../config/redis.js';
import { HttpStatusCode, ErrorCode } from '../types/common.types.js';

/**
 * Privacy-safe IP hashing using SHA-256 with a configurable salt.
 * Output truncated to 16 hex chars — enough for analytics, not reversible.
 */
function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + env.IP_HASH_SALT)
    .digest('hex')
    .slice(0, 16);
}

/** Shape of the Razorpay webhook event payload */
interface RazorpayWebhookEvent {
  readonly event: string;
  readonly payload: {
    readonly payment: {
      readonly entity: {
        readonly id: string;
        readonly order_id: string;
        readonly amount: number;
        readonly status: string;
        readonly error_description?: string;
      };
    };
  };
}

/** Donor wall entry returned to the public */
interface DonorWallEntry {
  readonly name: string;
  readonly message?: string;
  readonly socialLink?: string;
  readonly amountINR: number;
  readonly createdAt: Date;
}

/** Revenue stats returned to admin dashboard */
interface RevenueStats {
  readonly totalRevenue: number;
  readonly totalDonors: number;
  readonly avgDonation: number;
  readonly thisMonth: number;
  readonly lastMonth: number;
  readonly byAmount: ReadonlyArray<{ readonly range: string; readonly count: number }>;
}

export const paymentService = {
  /**
   * Step 1 — Create a Razorpay order and save a pending payment record.
   * Returns order details needed by the frontend to open Razorpay checkout.
   */
  async createOrder(params: {
    readonly amountINR: number;
    readonly donorName: string;
    readonly donorEmail: string;
    readonly donorMessage?: string;
    readonly donorSocialLink?: string;
    readonly isAnonymous: boolean;
    readonly showOnWall: boolean;
    readonly ip?: string;
    readonly userAgent?: string;
  }): Promise<{ orderId: string; amount: number; currency: string; keyId: string }> {
    // Validate amount range: min ₹1, max ₹50,000
    if (params.amountINR < 1 || params.amountINR > 50000) {
      throw AppError.badRequest('Amount must be between ₹1 and ₹50,000');
    }

    const amountPaise = Math.round(params.amountINR * 100);

    // Create Razorpay order via API
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `portfolio_${Date.now()}`,
      notes: {
        donorName: params.donorName,
        donorEmail: params.donorEmail,
      },
    });

    // Save pending payment record in MongoDB
    await Payment.create({
      razorpayOrderId: order.id,
      amountPaise,
      amountINR: params.amountINR,
      currency: 'INR',
      status: 'created',
      donorName: params.donorName,
      donorEmail: params.donorEmail,
      donorMessage: params.donorMessage,
      donorSocialLink: params.donorSocialLink,
      isAnonymous: params.isAnonymous,
      showOnWall: params.showOnWall,
      ipHash: params.ip ? hashIP(params.ip) : undefined,
      userAgent: params.userAgent,
      webhookVerified: false,
      emailSent: false,
    });

    return {
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
    };
  },

  /**
   * Step 2 — Verify frontend payment callback (defence-in-depth only).
   * The webhook is the source of truth — this is an additional safety check.
   */
  async verifyFrontendPayment(params: {
    readonly razorpayOrderId: string;
    readonly razorpayPaymentId: string;
    readonly razorpaySignature: string;
  }): Promise<{ verified: boolean }> {
    const isValid = verifyPaymentSignature({
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
      signature: params.razorpaySignature,
    });

    if (!isValid) {
      throw new AppError(
        'Payment signature verification failed',
        HttpStatusCode.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // Update DB — mark as captured (webhook will also do this as source of truth)
    await Payment.findOneAndUpdate(
      { razorpayOrderId: params.razorpayOrderId },
      {
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
        status: 'captured',
      },
    );

    return { verified: true };
  },

  /**
   * Step 3 — Process Razorpay webhook event (SOURCE OF TRUTH).
   * Idempotent: skips if already webhook-verified.
   * Sends thank-you + owner notification emails on successful capture.
   */
  async processWebhook(event: RazorpayWebhookEvent): Promise<void> {
    const paymentEntity = event.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    // Redis deduplication — prevent processing same webhook twice.
    // MongoDB idempotency (webhookVerified flag) is the real guard;
    // Redis is a fast early exit to avoid unnecessary DB queries.
    const dedupeKey = `webhook:processed:${paymentId}`;
    if (isRedisAvailable()) {
      try {
        const alreadyProcessed = await redis!.get(dedupeKey);
        if (alreadyProcessed) {
          logger.info('Webhook deduplicated via Redis', { paymentId });
          return;
        }
        // Mark as processing with 48hr TTL (longer than Razorpay's 24hr retry window)
        await redis!.setex(dedupeKey, 48 * 60 * 60, '1');
      } catch {
        // Redis failure — proceed to MongoDB idempotency check
      }
    }

    // Idempotency check — skip if already webhook-verified
    const existing = await Payment.findOne({ razorpayOrderId: orderId });

    if (!existing) {
      logger.warn('Webhook received for unknown order', { orderId });
      return;
    }

    if (existing.webhookVerified) {
      logger.info('Webhook already processed, skipping', { orderId });
      return;
    }

    if (event.event === 'payment.captured') {
      const updated = await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId },
        {
          razorpayPaymentId: paymentId,
          status: 'captured',
          webhookVerified: true,
        },
        { new: true },
      );

      if (updated && !updated.emailSent) {
        // Send emails — both thank-you and owner notification
        try {
          await Promise.all([
            emailService.sendThankYou({
              to: updated.donorEmail,
              name: updated.donorName,
              amountINR: updated.amountINR,
              message: updated.donorMessage,
              paymentId,
            }),
            emailService.sendOwnerNotification({
              donorName: updated.donorName,
              donorEmail: updated.donorEmail,
              amountINR: updated.amountINR,
              message: updated.donorMessage,
              socialLink: updated.donorSocialLink,
              paymentId,
              isAnonymous: updated.isAnonymous,
            }),
          ]);

          await Payment.findByIdAndUpdate(updated._id, { emailSent: true });
          logger.info('Payment emails sent successfully', { paymentId });
        } catch (emailErr: unknown) {
          logger.error('Email send failed after payment capture', {
            paymentId,
            error: emailErr instanceof Error ? emailErr.message : String(emailErr),
          });
          // Do NOT throw — payment is captured, email failure is non-fatal
        }
      }
    } else if (event.event === 'payment.failed') {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId },
        {
          status: 'failed',
          failureReason: paymentEntity.error_description,
          webhookVerified: true,
        },
      );

      logger.warn('Payment failed', { orderId, reason: paymentEntity.error_description });
    }
  },

  /**
   * Admin: get all payments with optional status filter and pagination.
   */
  async getAllPayments(filters: {
    readonly status?: string;
    readonly page?: number;
    readonly limit?: number;
  }): Promise<{ payments: ReadonlyArray<IPayment>; total: number; totalRevenue: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, filters.limit ?? 20);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filters.status) query['status'] = filters.status;

    const [payments, total, revenueResult] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'captured' } },
        { $group: { _id: null, total: { $sum: '$amountINR' } } },
      ]),
    ]);

    return {
      payments: payments as unknown as ReadonlyArray<IPayment>,
      total,
      totalRevenue: revenueResult[0]?.total ?? 0,
    };
  },

  /**
   * Public: donor wall — only captured payments where showOnWall=true.
   * Respects isAnonymous flag by replacing name and hiding social link.
   */
  async getDonorWall(): Promise<ReadonlyArray<DonorWallEntry>> {
    const donors = await Payment.find({
      status: 'captured',
      showOnWall: true,
    })
      .select('donorName donorMessage donorSocialLink amountINR isAnonymous createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return donors.map((d) => ({
      name: d.isAnonymous ? 'Anonymous' : d.donorName,
      message: d.donorMessage,
      socialLink: d.isAnonymous ? undefined : d.donorSocialLink,
      amountINR: d.amountINR,
      createdAt: d.createdAt,
    }));
  },

  /**
   * Admin: revenue stats aggregation for the dashboard.
   */
  async getRevenueStats(): Promise<RevenueStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [overall, thisMonthResult, lastMonthResult] = await Promise.all([
      Payment.aggregate<{ _id: null; total: number; count: number; avg: number }>([
        { $match: { status: 'captured' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$amountINR' },
            count: { $sum: 1 },
            avg: { $avg: '$amountINR' },
          },
        },
      ]),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'captured', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountINR' } } },
      ]),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'captured', createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amountINR' } } },
      ]),
    ]);

    // Amount distribution buckets
    const [under100, from100to499, from500to999, from1000plus] = await Promise.all([
      Payment.countDocuments({ status: 'captured', amountINR: { $lt: 100 } }),
      Payment.countDocuments({ status: 'captured', amountINR: { $gte: 100, $lt: 500 } }),
      Payment.countDocuments({ status: 'captured', amountINR: { $gte: 500, $lt: 1000 } }),
      Payment.countDocuments({ status: 'captured', amountINR: { $gte: 1000 } }),
    ]);

    return {
      totalRevenue: overall[0]?.total ?? 0,
      totalDonors: overall[0]?.count ?? 0,
      avgDonation: Math.round(overall[0]?.avg ?? 0),
      thisMonth: thisMonthResult[0]?.total ?? 0,
      lastMonth: lastMonthResult[0]?.total ?? 0,
      byAmount: [
        { range: '₹1–₹99', count: under100 },
        { range: '₹100–₹499', count: from100to499 },
        { range: '₹500–₹999', count: from500to999 },
        { range: '₹1000+', count: from1000plus },
      ],
    };
  },
};
