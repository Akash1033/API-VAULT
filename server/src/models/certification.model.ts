// Path: src/models/certification.model.ts
// Purpose: Mongoose schema for professional certifications
// Dependencies: mongoose

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICertificationDocument extends Document {
  _id: Types.ObjectId;
  readonly title: string;
  slug: string;
  readonly issuer: string;
  readonly credentialId: string;
  readonly credentialUrl: string;
  readonly thumbnailUrl: string;
  readonly issueDate: Date;
  readonly expiryDate: Date | null;
  readonly tags: ReadonlyArray<string>;
  readonly isPublished: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const certificationSchema = new Schema<ICertificationDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    issuer: {
      type: String,
      required: [true, 'Issuer is required'],
      trim: true,
      maxlength: [100, 'Issuer must be at most 100 characters'],
    },
    credentialId: {
      type: String,
      default: '',
      trim: true,
    },
    credentialUrl: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// Indexes

certificationSchema.index({ isPublished: 1 });
certificationSchema.index({ tags: 1 });
certificationSchema.index({ createdAt: -1 });
certificationSchema.index({ issueDate: -1 });
certificationSchema.index({ title: 'text', issuer: 'text' });

export const Certification = mongoose.model<ICertificationDocument>('Certification', certificationSchema);
