// Path: src/types/payment.ts

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
    backdrop_color?: string;
  };
  modal: {
    ondismiss: () => void;
    escape: boolean;
    animation: boolean;
  };
  handler: (response: RazorpayPaymentResponse) => void;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: string, handler: () => void) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export type PaymentStep =
  | 'idle'
  | 'form'
  | 'processing'
  | 'checkout'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'dismissed';
