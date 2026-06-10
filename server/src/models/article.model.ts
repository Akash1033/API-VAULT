// Path: src/models/article.model.ts
// Purpose: Mongoose schema for blog articles
// Dependencies: mongoose

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IArticleDocument extends Document {
  _id: Types.ObjectId;
  readonly title: string;
  slug: string;
  readonly excerpt: string;
  readonly content: string;
  readonly coverImageUrl: string;
  readonly tags: ReadonlyArray<string>;
  readonly readTimeMinutes: number;
  readonly isPublished: boolean;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const articleSchema = new Schema<IArticleDocument>(
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
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [500, 'Excerpt must be at most 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    coverImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    readTimeMinutes: {
      type: Number,
      default: 1,
      min: 1,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
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

articleSchema.index({ isPublished: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ title: 'text', excerpt: 'text' });

export const Article = mongoose.model<IArticleDocument>('Article', articleSchema);
