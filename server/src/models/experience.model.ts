// Path: src/models/experience.model.ts
// Purpose: Mongoose schema for professional experience
// Dependencies: mongoose

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export enum ExperienceType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
}

export interface IExperienceDocument extends Document {
  _id: Types.ObjectId;
  readonly company: string;
  slug: string;
  readonly role: string;
  readonly description: string;
  readonly responsibilities: ReadonlyArray<string>;
  readonly technologies: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly location: string;
  readonly type: ExperienceType;
  readonly isPublished: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const experienceSchema = new Schema<IExperienceDocument>(
  {
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      maxlength: [100, 'Company must be at most 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [100, 'Role must be at most 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    technologies: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ExperienceType),
      default: ExperienceType.FULL_TIME,
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

experienceSchema.index({ isPublished: 1 });
experienceSchema.index({ tags: 1 });
experienceSchema.index({ createdAt: -1 });
experienceSchema.index({ startDate: -1 });
experienceSchema.index({ company: 'text', role: 'text' });

export const Experience = mongoose.model<IExperienceDocument>('Experience', experienceSchema);
