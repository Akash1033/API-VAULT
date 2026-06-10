// Path: src/components/sections/Footer.tsx
// Purpose: Contact form section and social links footer with analytics tracking
// Dependencies: react, react-query, framer-motion, react-hook-form, zod, analytics utility

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { sendContactMessage } from '../../api/admin';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trackEvent } from '../../utils/analytics';

const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000)
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export const Footer: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText('akashvohra9877@gmail.com');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema)
  });

  const mutation = useMutation({
    mutationFn: sendContactMessage,
    onSuccess: () => {
      setSubmitted(true);
      setSubmitError(null);
      reset();
      // Track contact form submission
      void trackEvent({ type: 'contact_form', path: '/contact' });
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number; data?: { errors?: Array<{ message: string }>; message?: string } } };
      if (axiosError?.response?.status === 429) {
        setSubmitError('Too many messages sent. Please try again in an hour.');
        return;
      }
      const message = axiosError?.response?.data?.errors?.[0]?.message
        ?? axiosError?.response?.data?.message
        ?? 'Failed to send message. Please try again.';
      setSubmitError(message);
    }
  });

  const onSubmit = (data: ContactFormValues) => {
    setSubmitError(null);
    mutation.mutate(data);
  };

  return (
    <footer id="contact" className="bg-bgSurface border-t border-border py-[60px]">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-[48px]">
        
        <div>
          <div className="font-mono text-[13px] text-textSecondary">
            POST /api/v1/contact
          </div>
          <div className="font-mono text-[11px] text-textMuted mb-[20px]">
            // Content-Type: application/json
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-[11px] leading-[1.9] bg-bgRaised border border-border rounded-[8px] p-[16px]"
              >
                <div className="text-textMuted">{'{'}</div>
                <div className="pl-4">
                  <span className="text-blue">"success"</span>
                  <span className="text-textMuted">: </span>
                  <span className="text-green">true</span>
                  <span className="text-textMuted">,</span>
                </div>
                <div className="pl-4">
                  <span className="text-blue">"status"</span>
                  <span className="text-textMuted">: </span>
                  <span className="text-purple">201</span>
                  <span className="text-textMuted">,</span>
                </div>
                <div className="pl-4">
                  <span className="text-blue">"message"</span>
                  <span className="text-textMuted">: </span>
                  <span className="text-amber">"Message received. Will respond within 24h."</span>
                </div>
                <div className="text-textMuted">{'}'}</div>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="font-mono text-[12px] leading-[2.2]"
              >
                <div className="text-textMuted">{'{'}</div>
                
                <div className="pl-4 flex flex-col mb-2">
                  <div className="flex items-center">
                    <span className="text-blue shrink-0 w-[80px]">"name"</span>
                    <span className="text-textMuted shrink-0 mr-2">:</span>
                    <input 
                      type="text" 
                      {...register('name')}
                      className="bg-bgRaised border border-border rounded-[4px] text-textPrimary font-mono text-[12px] px-[8px] py-[4px] w-[calc(100%-100px)] outline-none focus:border-green"
                    />
                  </div>
                  {errors.name && (
                    <div className="text-red text-[10px] ml-[96px] mt-1">
                      // {errors.name.message}
                    </div>
                  )}
                </div>
                
                <div className="pl-4 flex flex-col mb-2">
                  <div className="flex items-center">
                    <span className="text-blue shrink-0 w-[80px]">"email"</span>
                    <span className="text-textMuted shrink-0 mr-2">:</span>
                    <input 
                      type="email" 
                      {...register('email')}
                      className="bg-bgRaised border border-border rounded-[4px] text-textPrimary font-mono text-[12px] px-[8px] py-[4px] w-[calc(100%-100px)] outline-none focus:border-green"
                    />
                  </div>
                  {errors.email && (
                    <div className="text-red text-[10px] ml-[96px] mt-1">
                      // {errors.email.message}
                    </div>
                  )}
                </div>
                
                <div className="pl-4 flex flex-col mb-2">
                  <div className="flex items-start">
                    <span className="text-blue shrink-0 w-[80px] mt-2">"message"</span>
                    <span className="text-textMuted shrink-0 mr-2 mt-2">:</span>
                    <textarea 
                      rows={4}
                      {...register('message')}
                      className="bg-bgRaised border border-border rounded-[4px] text-textPrimary font-mono text-[12px] px-[8px] py-[4px] w-[calc(100%-100px)] outline-none focus:border-green resize-none"
                    />
                  </div>
                  {errors.message && (
                    <div className="text-red text-[10px] ml-[96px] mt-1">
                      // {errors.message.message}
                    </div>
                  )}
                </div>

                <div className="text-textMuted">{'}'}</div>

                {submitError && (
                  <div className="text-red text-[11px] mt-[12px]">
                    // error: {submitError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="bg-green text-[#0a0c0b] font-mono text-[12px] px-[20px] py-[8px] rounded-[4px] border-none mt-[12px] hover:bg-[#22c55e] cursor-pointer disabled:opacity-70"
                >
                  {mutation.isPending ? 'sending...' : 'POST \u2192'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="font-mono text-[11px] text-textMuted mb-[12px]">
            // connect
          </div>
          
          <div className="flex flex-col">
            {[
              { name: 'GitHub', url: 'https://github.com/Akash1033/' },
              { name: 'LinkedIn', url: 'https://linkedin.com/in/akash-vohra01' },
              { name: 'Email', url: '#' }
            ].map(link => (
              <a 
                key={link.name}
                href={link.url}
                onClick={link.name === 'Email' ? handleCopyEmail : undefined}
                target={link.name === 'Email' ? undefined : "_blank"}
                rel={link.name === 'Email' ? undefined : "noreferrer"}
                className="flex items-center gap-2 py-[8px] border-b border-border font-mono text-[12px] text-textMuted hover:text-green transition-colors duration-150 cursor-pointer no-underline"
              >
                <span>&rarr; {link.name}</span>
                {link.name === 'Email' && emailCopied && (
                  <span className="text-green text-[10px] bg-[rgba(74,222,128,0.1)] px-[4px] py-[2px] rounded-[3px]">copied!</span>
                )}
              </a>
            ))}
          </div>

          <div className="font-mono text-[10px] text-green mt-[20px]">
            Uptime: 99.9%
          </div>
          <div className="font-mono text-[10px] text-textMuted mt-[6px]">
            build: a3f92c1
          </div>
        </div>

      </div>
    </footer>
  );
};
