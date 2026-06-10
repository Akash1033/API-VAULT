// Path: src/hooks/useRazorpay.ts

import { useCallback, useRef } from 'react';
import type { RazorpayOptions, RazorpayInstance } from '../types/payment';

// Dynamically loads Razorpay checkout.js — only once
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const razorpayRef = useRef<RazorpayInstance | null>(null);

  const openCheckout = useCallback(async (options: RazorpayOptions): Promise<void> => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error('Failed to load Razorpay checkout');

    razorpayRef.current = new window.Razorpay(options);
    razorpayRef.current.open();
  }, []);

  const closeCheckout = useCallback(() => {
    razorpayRef.current?.close();
  }, []);

  return { openCheckout, closeCheckout };
}
