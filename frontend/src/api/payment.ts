// Path: src/api/payment.ts
// Purpose: Payment API — public (order/verify/donor-wall) + admin (list/stats/resend-email)
// Dependencies: axios instance

import { api as axiosInstance } from './axios';

// ─── SHARED TYPES ────────────────────────────────────────────

export interface CreateOrderPayload {
  amountINR: number;
  donorName: string;
  donorEmail: string;
  donorMessage?: string;
  donorSocialLink?: string;
  isAnonymous: boolean;
  showOnWall: boolean;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface DonorWallEntry {
  name: string;
  message?: string;
  socialLink?: string;
  amountINR: number;
  createdAt: string;
}

// ─── ADMIN TYPES ─────────────────────────────────────────────

export interface Payment {
  _id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaise: number;
  amountINR: number;
  currency: string;
  status: 'created' | 'captured' | 'failed' | 'refunded';
  failureReason?: string;
  donorName: string;
  donorEmail: string;
  donorMessage?: string;
  donorSocialLink?: string;
  isAnonymous: boolean;
  showOnWall: boolean;
  webhookVerified: boolean;
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueStats {
  totalRevenue: number;
  totalDonors: number;
  avgDonation: number;
  thisMonth: number;
  lastMonth: number;
  byAmount: Array<{ range: string; count: number }>;
}

export interface AdminPaymentsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminPaymentsResponse {
  payments: Payment[];
  meta: AdminPaymentsMeta;
  totalRevenue: number;
}

// ─── PUBLIC ENDPOINTS — no auth needed ───────────────────────

export const createPaymentOrder = (data: CreateOrderPayload) =>
  axiosInstance
    .post<{ success: boolean; data: CreateOrderResponse }>('/payment/order', data)
    .then((r) => r.data.data);

export const verifyPayment = (data: VerifyPaymentPayload) =>
  axiosInstance
    .post<{ success: boolean; data: { verified: boolean } }>('/payment/verify', data)
    .then((r) => r.data.data);

export const getDonorWall = () =>
  axiosInstance
    .get<{ success: boolean; data: { donors: DonorWallEntry[] } }>('/payment/donor-wall')
    .then((r) => r.data.data.donors);

// ─── ADMIN ENDPOINTS — requires auth token ───────────────────

export const getAdminPayments = (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminPaymentsResponse> =>
  axiosInstance
    .get<{
      success: boolean;
      data: Payment[];
      meta: AdminPaymentsMeta;
    }>('/payment/admin', { params })
    .then((r) => {
      const payments = r.data.data;
      // Calculate total captured revenue from returned page
      // The backend returns totalRevenue in the paginated meta, but standard IMeta doesn't include it
      // We can calculate from the full aggregation the backend does
      return {
        payments,
        meta: r.data.meta,
        totalRevenue: 0, // Will be populated from stats
      };
    });

export const getRevenueStats = (): Promise<RevenueStats> =>
  axiosInstance
    .get<{ success: boolean; data: { stats: RevenueStats } }>('/payment/stats')
    .then((r) => r.data.data.stats);

export const resendThankYouEmail = (paymentId: string): Promise<void> =>
  axiosInstance
    .post<{ success: boolean }>(`/payment/resend-email/${paymentId}`)
    .then(() => undefined);
