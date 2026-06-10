// Path: src/services/email.service.ts
// Purpose: Nodemailer transporter + email templates for donor thank-you and owner notification
// Dependencies: nodemailer, env config

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const emailService = {
  /**
   * Send a styled thank-you email to the donor after successful payment.
   */
  async sendThankYou(params: {
    readonly to: string;
    readonly name: string;
    readonly amountINR: number;
    readonly message?: string;
    readonly paymentId: string;
  }): Promise<void> {
    const firstName = params.name.split(' ')[0];

    await transporter.sendMail({
      from: `"Akash Vohra" <${env.SMTP_USER}>`,
      to: params.to,
      subject: `Thank you for supporting my work, ${firstName}! 🙏`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'IBM Plex Mono', monospace; background: #0a0c0b; color: #e5e7eb; padding: 32px; max-width: 560px; margin: 0 auto;">
          <div style="border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 28px;">
            <p style="color: #4ade80; font-size: 11px; margin: 0 0 16px;">POST /api/v1/payment → 201 Created</p>
            <h1 style="font-size: 20px; font-weight: 500; margin: 0 0 16px;">Thank you, ${firstName}!</h1>
            <p style="color: #9ca3af; font-size: 13px; line-height: 1.7; margin: 0 0 20px;">
              Your support of <strong style="color: #fbbf24;">₹${params.amountINR}</strong> means a lot.
              It helps me keep building open-source projects, writing technical articles,
              and sharing everything I learn about backend engineering.
            </p>
            ${params.message ? `
            <div style="background: #0d0f0e; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 14px; margin: 0 0 20px;">
              <p style="color: #4b5563; font-size: 10px; margin: 0 0 6px;">// your message</p>
              <p style="color: #9ca3af; font-size: 13px; margin: 0; font-style: italic;">"${params.message}"</p>
            </div>` : ''}
            <div style="background: #0d0f0e; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 14px; margin: 0 0 24px; font-size: 11px;">
              <span style="color: #60a5fa;">"payment_id"</span><span style="color: #4b5563;">: </span>
              <span style="color: #fbbf24;">"${params.paymentId}"</span>
            </div>
            <p style="color: #4b5563; font-size: 11px; margin: 0;">— Akash Vohra · backend engineer</p>
          </div>
        </body>
        </html>
      `,
    });
  },

  /**
   * Send a notification email to the portfolio owner when a payment is captured.
   */
  async sendOwnerNotification(params: {
    readonly donorName: string;
    readonly donorEmail: string;
    readonly amountINR: number;
    readonly message?: string;
    readonly socialLink?: string;
    readonly paymentId: string;
    readonly isAnonymous: boolean;
  }): Promise<void> {
    const displayName = params.isAnonymous ? 'Anonymous' : params.donorName;

    await transporter.sendMail({
      from: `"Portfolio Payments" <${env.SMTP_USER}>`,
      to: env.OWNER_EMAIL,
      subject: `💰 New support: ₹${params.amountINR} from ${displayName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'IBM Plex Mono', monospace; background: #0a0c0b; color: #e5e7eb; padding: 32px; max-width: 560px; margin: 0 auto;">
          <div style="border: 1px solid rgba(74,222,128,0.3); border-radius: 8px; padding: 28px;">
            <p style="color: #4ade80; font-size: 11px; margin: 0 0 12px;">● payment.captured — webhook verified</p>
            <h1 style="font-size: 18px; font-weight: 500; margin: 0 0 20px;">₹${params.amountINR} received</h1>
            <div style="background: #0d0f0e; border-radius: 6px; padding: 16px; font-size: 11px; line-height: 2;">
              <div><span style="color: #60a5fa;">"donor"</span><span style="color: #4b5563;">: </span><span style="color: #fbbf24;">"${displayName}"</span></div>
              <div><span style="color: #60a5fa;">"email"</span><span style="color: #4b5563;">: </span><span style="color: #fbbf24;">"${params.donorEmail}"</span></div>
              <div><span style="color: #60a5fa;">"amount"</span><span style="color: #4b5563;">: </span><span style="color: #c084fc;">₹${params.amountINR}</span></div>
              ${params.message ? `<div><span style="color: #60a5fa;">"message"</span><span style="color: #4b5563;">: </span><span style="color: #fbbf24;">"${params.message}"</span></div>` : ''}
              ${params.socialLink ? `<div><span style="color: #60a5fa;">"social"</span><span style="color: #4b5563;">: </span><span style="color: #4ade80;">"${params.socialLink}"</span></div>` : ''}
              <div><span style="color: #60a5fa;">"payment_id"</span><span style="color: #4b5563;">: </span><span style="color: #fbbf24;">"${params.paymentId}"</span></div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  },
};
