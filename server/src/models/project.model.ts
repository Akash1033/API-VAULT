// Path: src/models/project.model.ts
// Purpose: Mongoose schema for portfolio projects with indexed fields for querying
// Dependencies: mongoose

import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface IProjectDocument extends Document {
  _id: Types.ObjectId;
  readonly title: string;
  slug: string;
  readonly description: string;
  readonly longDescription: string;
  readonly technologies: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
  readonly githubUrl: string;
  readonly liveUrl: string;
  readonly thumbnailUrl: string;
  readonly images: ReadonlyArray<string>;
  readonly featured: boolean;
  readonly displayOrder: number;
  readonly isPublished: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const projectSchema = new Schema<IProjectDocument>(
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
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    longDescription: {
      type: String,
      default: '',
      trim: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    liveUrl: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
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

projectSchema.index({ isPublished: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ featured: 1, displayOrder: 1 });
projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });

export const Project = mongoose.model<IProjectDocument>('Project', projectSchema);
