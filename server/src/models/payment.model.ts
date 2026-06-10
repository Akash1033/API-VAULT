// Path: src/models/payment.model.ts
// Purpose: Mongoose schema for Razorpay payment records with donor info and processing metadata
// Dependencies: mongoose

import { Schema, model, type Document } from 'mongoose';

export type PaymentStatus = 'created' | 'captured' | 'failed' | 'refunded';

export interface IPayment extends Document {
  // Razorpay identifiers
  readonly razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  // Amount (always in paise — 1 INR = 100 paise)
  readonly amountPaise: number; // e.g. 19900 = ₹199
  readonly amountINR: number; // computed: amountPaise / 100
  readonly currency: string; // 'INR'

  // Status
  status: PaymentStatus;
  failureReason?: string;

  // Donor information
  readonly donorName: string;
  readonly donorEmail: string;
  readonly donorMessage?: string;
  readonly donorSocialLink?: string;

  // Preferences
  readonly isAnonymous: boolean; // donor chose to hide name from public wall
  readonly showOnWall: boolean; // donor opted into public donor wall

  // Metadata
  readonly ipHash?: string; // privacy-safe hashed IP
  readonly userAgent?: string;
  webhookVerified: boolean; // true only after webhook confirmation
  emailSent: boolean; // thank-you email sent

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, sparse: true, index: true },
    razorpaySignature: { type: String, select: false },

    amountPaise: { type: Number, required: true, min: 100 },
    amountINR: { type: Number, required: true },
    currency: { type: String, default: 'INR', maxlength: 3 },

    status: {
      type: String,
      enum: ['created', 'captured', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    failureReason: { type: String },

    donorName: { type: String, required: true, trim: true, maxlength: 100 },
    donorEmail: { type: String, required: true, trim: true, lowercase: true },
    donorMessage: { type: String, trim: true, maxlength: 500 },
    donorSocialLink: { type: String, trim: true, maxlength: 200 },

    isAnonymous: { type: Boolean, default: false },
    showOnWall: { type: Boolean, default: true },

    ipHash: { type: String, select: false },
    userAgent: { type: String, select: false },
    webhookVerified: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound indexes for admin dashboard queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ donorEmail: 1 });
paymentSchema.index({ showOnWall: 1, status: 1, createdAt: -1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
