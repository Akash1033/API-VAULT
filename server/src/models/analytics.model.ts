// Path: src/models/analytics.model.ts
// Purpose: Mongoose schema for analytics event tracking — stores page views, project views, resume clicks, API requests, and contact form submissions
// Dependencies: mongoose

import { Schema, model, type Document } from 'mongoose';

export type EventType =
  | 'page_view'
  | 'project_view'
  | 'resume_click'
  | 'api_request'
  | 'contact_form';

export interface IAnalyticsEvent extends Document {
  readonly type: EventType;
  readonly path: string;
  readonly resourceId?: string;
  readonly resourceSlug?: string;
  readonly sessionId?: string;
  readonly ipHash?: string;
  readonly userAgent?: string;
  readonly referrer?: string;
  readonly country?: string;
  readonly duration?: number;
  readonly createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    type: {
      type: String,
      enum: ['page_view', 'project_view', 'resume_click', 'api_request', 'contact_form'],
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      maxlength: 500,
    },
    resourceId: {
      type: String,
      index: true,
    },
    resourceSlug: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    ipHash: {
      type: String,
      select: false,
    },
    userAgent: {
      type: String,
      select: false,
    },
    referrer: {
      type: String,
      maxlength: 500,
    },
    country: {
      type: String,
      maxlength: 2,
    },
    duration: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
    timestamps: false,
  }
);

// Compound indexes for common aggregation queries
analyticsEventSchema.index({ type: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ type: 1, createdAt: -1, sessionId: 1 });
analyticsEventSchema.index({ resourceSlug: 1, type: 1, createdAt: -1 });

// Auto-delete events older than 90 days (TTL index — keeps DB size bounded)
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AnalyticsEvent = model<IAnalyticsEvent>('AnalyticsEvent', analyticsEventSchema);
