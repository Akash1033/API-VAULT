// Path: src/models/skill.model.ts
// Purpose: Mongoose schema for portfolio skills with category grouping
// Dependencies: mongoose

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export enum SkillCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  DEVOPS = 'devops',
  TOOLS = 'tools',
  OTHER = 'other',
}

export interface ISkillDocument extends Document {
  _id: Types.ObjectId;
  readonly name: string;
  slug: string;
  readonly category: SkillCategory;
  readonly proficiency: number;
  readonly iconUrl: string;
  readonly displayOrder: number;
  readonly isPublished: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const skillSchema = new Schema<ISkillDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: Object.values(SkillCategory),
    },
    proficiency: {
      type: Number,
      required: [true, 'Proficiency is required'],
      min: [1, 'Proficiency must be at least 1'],
      max: [100, 'Proficiency must be at most 100'],
    },
    iconUrl: {
      type: String,
      default: '',
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
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

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

skillSchema.index({ isPublished: 1 });
skillSchema.index({ createdAt: -1 });
skillSchema.index({ category: 1 });
skillSchema.index({ name: 'text' });

export const Skill = mongoose.model<ISkillDocument>('Skill', skillSchema);
