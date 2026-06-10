// Path: src/components/sections/SupportWidget.tsx
// Purpose: Public payment widget — amount selection, Razorpay checkout, donor wall display
// Dependencies: react, tanstack-query, react-hook-form, zod, framer-motion, payment API, useRazorpay

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { createPaymentOrder, verifyPayment, getDonorWall } from '../../api/payment';
import { useRazorpay } from '../../hooks/useRazorpay';
import type { PaymentStep } from '../../types/payment';
import { SectionHeader } from '../shared/SectionHeader';
import { timeAgo } from '../../utils/timeAgo';
import { useUiStore } from '../../store/uiStore';

// Zod Form Schema
const supportSchema = z.object({
  donorName: z.string().min(1, 'Name required').max(100),
  donorEmail: z.string().email('Invalid email'),
  donorMessage: z.string().max(500).optional(),
  donorSocialLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  isAnonymous: z.boolean(),
  showOnWall: z.boolean(),
});

type SupportForm = z.infer<typeof supportSchema>;

const ToggleSwitch = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center cursor-pointer gap-2">
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-8 h-4 rounded-full transition-colors ${value ? 'bg-green/30' : 'bg-bgSurface border border-border'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${value ? 'transform translate-x-4 bg-green' : 'bg-textMuted'}`}></div>
    </div>
    <span className="font-mono text-[11px] text-textMuted select-none">{label}</span>
  </label>
);

export const SupportWidget: React.FC = () => {
  const [step, setStep] = useState<PaymentStep>('idle');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { openCheckout } = useRazorpay();
  const queryClient = useQueryClient();

  // Subscribe to store changes from an external system (Zustand) — avoids
  // calling setState synchronously inside a useEffect body.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const unsubscribe = useUiStore.subscribe((state) => {
      if (state.openSupportForm && stepRef.current === 'idle') {
        setStep('form');
        state.setOpenSupportForm(false);
      }
    });
    return unsubscribe;
  }, []);

  const { register, handleSubmit, formState: { errors }, control, reset } = useForm<SupportForm>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      isAnonymous: false,
      showOnWall: true,
    }
  });

  const [formAttempted, setFormAttempted] = useState(false);

  const { data: donors = [], isLoading: isLoadingDonors } = useQuery({
    queryKey: ['donor-wall'],
    queryFn: getDonorWall,
    staleTime: 5 * 60 * 1000,
  });

  const totalRaised = donors.reduce((sum, d) => sum + d.amountINR, 0);

  const onSubmit = async (formData: SupportForm) => {
    setFormAttempted(true);
    setErrorMessage('');

    // Guard: prevent re-submission while another payment is in progress
    if (step === 'processing' || step === 'checkout' || step === 'verifying') return;

    // Guard: validate amount client-side before hitting the API
    const finalAmount = selectedAmount ?? parseInt(customAmount ?? '0');
    if (isNaN(finalAmount) || finalAmount < 1 || finalAmount > 50000) {
      setStep('failed');
      setErrorMessage('Amount must be between ₹1 and ₹50,000');
      return;
    }

    try {
      setStep('processing');

      // Step 1: Create order
      const order = await createPaymentOrder({
        amountINR: finalAmount,
        donorName: formData.donorName,
        donorEmail: formData.donorEmail,
        donorMessage: formData.donorMessage,
        donorSocialLink: formData.donorSocialLink,
        isAnonymous: formData.isAnonymous,
        showOnWall: formData.showOnWall,
      });

      setStep('checkout');

      // Step 2: Open Razorpay checkout
      await openCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Akash Vohra',
        description: 'Support my backend engineering work',
        order_id: order.orderId,
        prefill: {
          name: formData.donorName,
          email: formData.donorEmail,
          contact: '9999999999', // Dummy number required by Razorpay Test Mode to show UPI
        },
        theme: {
          color: '#4ade80',
          backdrop_color: '#0a0c0b',
        },
        modal: {
          ondismiss: () => setStep('dismissed'),
          escape: true,
          animation: true,
        },
        handler: async (response) => {
          setStep('verifying');
          try {
            // Step 3: Verify payment signature
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPaymentId(response.razorpay_payment_id);
            setStep('success');
            // Refresh donor wall
            queryClient.invalidateQueries({ queryKey: ['donor-wall'] });
            // Clear sensitive form data
            reset();
            setSelectedAmount(null);
            setCustomAmount('');
          } catch {
            setStep('failed');
            setErrorMessage('Payment verification failed. If you were charged, contact support.');
          }
        },
      });
    } catch (err: unknown) {
      // Handle specific error codes from backend
      const errorData = err as { response?: { data?: { errors?: Array<{ code?: string; message?: string }> } } };
      const backendMessage = errorData?.response?.data?.errors?.[0]?.message;

      if (backendMessage) {
        setErrorMessage(backendMessage);
      } else {
        setErrorMessage('Failed to initialize payment. Please try again.');
      }
      setStep('failed');
    }
  };

  const amountError = formAttempted && !selectedAmount && (!customAmount || parseInt(customAmount) < 1);

  return (
    <section id="support" className="py-[80px] border-t border-border bg-bgBase">
      <div className="max-w-[1200px] mx-auto px-6">
        <SectionHeader
          method="POST"
          endpoint="/api/v1/payment/order"
          title="Support My Work"
          humanLabel="Support My Work"
          chips={[
            { label: 'powered by Razorpay' },
            { label: 'UPI · Cards · NetBanking' },
            { label: 'secure checkout' },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-[48px] items-start mt-8">

          {/* LEFT COLUMN — Payment form */}
          <div>
            <AnimatePresence mode="wait">
              {step === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-bgSurface border border-border rounded-[8px] p-[24px]"
                >
                  <div className="font-mono text-[12px] text-textMuted">POST /api/v1/payment/order</div>
                  <div className="font-mono text-[10px] text-textMuted mb-[20px]">// Content-Type: application/json</div>

                  <div className="font-mono text-[11px] leading-[2] mb-6">
                    <span className="text-textMuted">{'{'}</span><br />
                    <div className="pl-4">
                      <span className="text-blue">"purpose"</span><span className="text-textMuted">: </span><span className="text-amber">"support_my_work"</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"methods"</span><span className="text-textMuted">: [</span><span className="text-amber">"UPI"</span><span className="text-textMuted">, </span><span className="text-amber">"Cards"</span><span className="text-textMuted">, </span><span className="text-amber">"NetBanking"</span><span className="text-textMuted">, </span><span className="text-amber">"Wallets"</span><span className="text-textMuted">],</span><br />
                      <span className="text-blue">"currency"</span><span className="text-textMuted">: </span><span className="text-amber">"INR"</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"min_amount"</span><span className="text-textMuted">: </span><span className="text-purple">1</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"platform"</span><span className="text-textMuted">: </span><span className="text-amber">"Razorpay"</span>
                    </div>
                    <span className="text-textMuted">{'}'}</span>
                  </div>

                  <button
                    onClick={() => setStep('form')}
                    className="w-full bg-transparent border border-green text-green font-mono text-[12px] py-[10px] rounded-[4px] hover:bg-green/10 transition-colors"
                  >
                    Support My Work &rarr;
                  </button>
                </motion.div>
              )}

              {step === 'form' && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="mb-[20px]">
                    <div className="font-mono text-[11px] text-textMuted mb-[8px]">// amount *</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-[8px]">
                      {[49, 99, 199, 499].map(amt => (
                        <div
                          key={amt}
                          onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                          className={`font-mono text-[12px] p-[8px] rounded-[4px] text-center cursor-pointer border transition-colors ${selectedAmount === amt
                              ? 'bg-green/10 border-green/40 text-green'
                              : 'bg-bgRaised border-border text-textSecondary hover:border-borderHover'
                            }`}
                        >
                          ₹{amt}
                        </div>
                      ))}
                    </div>
                    <div className="mt-[8px] flex flex-row items-center gap-[8px]">
                      <span className="font-mono text-[13px] text-textMuted">₹</span>
                      <input
                        type="number"
                        min="1"
                        max="50000"
                        placeholder="custom amount"
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className="bg-bgRaised border border-border font-mono text-[12px] px-[10px] py-[8px] rounded-[4px] text-textPrimary flex-1 outline-none focus:border-green"
                      />
                    </div>
                    {amountError && <div className="font-mono text-[10px] text-red mt-2">// amount required</div>}
                  </div>

                  <div className="flex flex-col gap-[14px] mb-[20px] font-mono text-[12px]">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-blue shrink-0 w-[100px]">"name"</span>
                        <span className="text-textMuted shrink-0 mr-2">:</span>
                        <input
                          type="text"
                          {...register('donorName')}
                          className="bg-bgRaised border border-border rounded-[4px] text-textPrimary px-[8px] py-[6px] w-[calc(100%-120px)] outline-none focus:border-green"
                        />
                      </div>
                      {errors.donorName && <div className="text-red text-[10px] ml-[116px] mt-1">// {errors.donorName.message}</div>}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-blue shrink-0 w-[100px]">"email"</span>
                        <span className="text-textMuted shrink-0 mr-2">:</span>
                        <input
                          type="email"
                          {...register('donorEmail')}
                          className="bg-bgRaised border border-border rounded-[4px] text-textPrimary px-[8px] py-[6px] w-[calc(100%-120px)] outline-none focus:border-green"
                        />
                      </div>
                      {errors.donorEmail && <div className="text-red text-[10px] ml-[116px] mt-1">// {errors.donorEmail.message}</div>}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-start mt-2">
                        <span className="text-blue shrink-0 w-[100px] mt-1">"message"</span>
                        <span className="text-textMuted shrink-0 mr-2 mt-1">:</span>
                        <textarea
                          rows={3}
                          placeholder="Say something nice... (optional)"
                          {...register('donorMessage')}
                          className="bg-bgRaised border border-border rounded-[4px] text-textPrimary px-[8px] py-[6px] w-[calc(100%-120px)] outline-none focus:border-green resize-none placeholder-textMuted/50"
                        />
                      </div>
                      {errors.donorMessage && <div className="text-red text-[10px] ml-[116px] mt-1">// {errors.donorMessage.message}</div>}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-blue shrink-0 w-[100px]">"social_link"</span>
                        <span className="text-textMuted shrink-0 mr-2">:</span>
                        <input
                          type="text"
                          placeholder="https://github.com/Akash1033/... (optional)"
                          {...register('donorSocialLink')}
                          className="bg-bgRaised border border-border rounded-[4px] text-textPrimary px-[8px] py-[6px] w-[calc(100%-120px)] outline-none focus:border-green placeholder-textMuted/50"
                        />
                      </div>
                      {errors.donorSocialLink && <div className="text-red text-[10px] ml-[116px] mt-1">// {errors.donorSocialLink.message}</div>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-[20px] p-[12px] bg-bgRaised border border-border rounded-[6px] mb-6">
                    <Controller
                      name="isAnonymous"
                      control={control}
                      render={({ field }) => (
                        <ToggleSwitch label="anonymous donation" value={field.value} onChange={field.onChange} />
                      )}
                    />
                    <Controller
                      name="showOnWall"
                      control={control}
                      render={({ field }) => (
                        <ToggleSwitch label="show on donor wall" value={field.value} onChange={field.onChange} />
                      )}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedAmount && (!customAmount || parseInt(customAmount) < 1)}
                    className="w-full bg-green text-[#0a0c0b] font-mono text-[12px] py-[12px] rounded-[4px] border-none cursor-pointer hover:bg-[#22c55e] disabled:opacity-70 transition-colors"
                  >
                    POST &rarr; ₹{selectedAmount || customAmount || '?'}
                  </button>
                </motion.form>
              )}

              {(step === 'processing' || step === 'checkout' || step === 'verifying') && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-bgSurface border border-border rounded-[8px] p-[24px]"
                >
                  <div className="font-mono text-[11px] leading-[2]">
                    <span className="text-textMuted">{'{'}</span><br />
                    <div className="pl-4">
                      <span className="text-blue">"status"</span><span className="text-textMuted">: </span><span className="text-amber">"{step === 'verifying' ? 'verifying_payment' : 'creating_order'}"</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"{step === 'verifying' ? 'Confirming with bank...' : 'Initializing Razorpay checkout...'}"</span>
                    </div>
                    <span className="text-textMuted">{'}'}</span>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <div className="w-2 h-2 bg-green rounded-full animate-ping"></div>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-bgSurface border border-border rounded-[8px] p-[24px]"
                >
                  <div className="font-mono text-[11px] leading-[2] mb-6">
                    <span className="text-textMuted">{'{'}</span><br />
                    <div className="pl-4">
                      <span className="text-blue">"success"</span><span className="text-textMuted">: </span><span className="text-green">true</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"status"</span><span className="text-textMuted">: </span><span className="text-purple">201</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"Thank you! Check your email for confirmation."</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"payment_id"</span><span className="text-textMuted">: </span><span className="text-amber">"{paymentId}"</span>
                    </div>
                    <span className="text-textMuted">{'}'}</span>
                  </div>
                  <button onClick={() => setStep('idle')} className="font-mono text-[11px] text-textMuted hover:text-textPrimary bg-transparent border-none cursor-pointer p-0">
                    &larr; Back
                  </button>
                </motion.div>
              )}

              {step === 'failed' && (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-bgSurface border border-border rounded-[8px] p-[24px]"
                >
                  <div className="font-mono text-[11px] leading-[2] mb-6">
                    <span className="text-textMuted">{'{'}</span><br />
                    <div className="pl-4">
                      <span className="text-blue">"success"</span><span className="text-textMuted">: </span><span className="text-red">false</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"status"</span><span className="text-textMuted">: </span><span className="text-purple">402</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"error_detail"</span><span className="text-textMuted">: </span><span className="text-amber">"{errorMessage || 'Payment could not be processed'}"</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"hint"</span><span className="text-textMuted">: </span><span className="text-amber">"You can try again with a different payment method."</span>
                    </div>
                    <span className="text-textMuted">{'}'}</span>
                  </div>
                  <button
                    onClick={() => { setStep('form'); setErrorMessage(''); }}
                    className="bg-transparent border border-textMuted text-textPrimary font-mono text-[12px] px-4 py-2 rounded-[4px] hover:border-textPrimary transition-colors"
                  >
                    Try Again &rarr;
                  </button>
                </motion.div>
              )}

              {step === 'dismissed' && (
                <motion.div
                  key="dismissed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-bgSurface border border-border rounded-[8px] p-[24px]"
                >
                  <div className="font-mono text-[11px] leading-[2] mb-6">
                    <span className="text-textMuted">{'{'}</span><br />
                    <div className="pl-4">
                      <span className="text-blue">"success"</span><span className="text-textMuted">: </span><span className="text-red">false</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"status"</span><span className="text-textMuted">: </span><span className="text-purple">0</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"Payment cancelled."</span><span className="text-textMuted">,</span><br />
                      <span className="text-blue">"hint"</span><span className="text-textMuted">: </span><span className="text-amber">"No amount was charged."</span>
                    </div>
                    <span className="text-textMuted">{'}'}</span>
                  </div>
                  <button
                    onClick={() => setStep('form')}
                    className="bg-transparent border border-textMuted text-textPrimary font-mono text-[12px] px-4 py-2 rounded-[4px] hover:border-textPrimary transition-colors"
                  >
                    Try Again &rarr;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN — Donor Wall */}
          <div>
            <div className="font-mono text-[12px] text-textMuted">GET /api/v1/payment/donor-wall</div>
            <div className="font-sans text-[18px] font-medium text-textPrimary mt-[8px] mb-4">// Supporters</div>

            {donors.length > 0 && (
              <div className="font-mono text-[11px] text-textMuted mb-4">
                // total raised: <span className="text-green">₹{totalRaised}</span>
              </div>
            )}

            <div className="flex flex-col gap-[8px] max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingDonors ? (
                // Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-bgSurface border border-border rounded-[6px] p-[12px] animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-bgRaised w-24 rounded"></div>
                      <div className="h-4 bg-bgRaised w-12 rounded"></div>
                    </div>
                    <div className="mt-2 h-3 bg-bgRaised w-3/4 rounded"></div>
                  </div>
                ))
              ) : donors.length === 0 ? (
                // Empty state
                <div className="bg-bgSurface border border-border rounded-[8px] p-[24px] text-center">
                  <div className="font-mono text-[11px] leading-[2] inline-block text-left">
                    <span className="text-textMuted">{'{'}</span><br />
                    <div className="pl-4">
                      <span className="text-blue">"donors"</span><span className="text-textMuted">: [],</span><br />
                      <span className="text-blue">"message"</span><span className="text-textMuted">: </span><span className="text-amber">"Be the first to support!"</span>
                    </div>
                    <span className="text-textMuted">{'}'}</span>
                  </div>
                </div>
              ) : (
                // Donor list
                donors.map((donor, idx) => (
                  <div key={idx} className="bg-bgSurface border border-border rounded-[6px] py-[12px] px-[14px]">
                    <div className="flex justify-between items-center">
                      <div className="font-sans text-[13px] font-medium text-textPrimary">
                        {donor.socialLink ? (
                          <a href={donor.socialLink} target="_blank" rel="noreferrer" className="text-green hover:text-amber no-underline">
                            {donor.name}
                          </a>
                        ) : (
                          donor.name
                        )}
                      </div>
                      <div className="font-mono text-[12px] text-amber">₹{donor.amountINR}</div>
                    </div>
                    {donor.message && (
                      <div className="mt-[6px] font-mono text-[10px] text-textMuted">
                        // {donor.message}
                      </div>
                    )}
                    <div className="mt-[6px] font-mono text-[10px] text-textMuted opacity-60">
                      {timeAgo(donor.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
