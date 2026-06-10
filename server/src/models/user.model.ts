// Path: src/models/user.model.ts
// Purpose: Mongoose User schema with bcrypt password hashing and role-based access
// Dependencies: mongoose, bcryptjs, auth.types

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, type IUserDocument } from '../types/auth.types.js';

const BCRYPT_ROUNDS = 12;

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        delete ret['password'];
        return ret;
      },
    },
  }
);

// ---------------------------------------------------------------------------
// Pre-save hook: hash password only if modified
// ---------------------------------------------------------------------------
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  (this as { password: string }).password = await bcrypt.hash(this.password, salt);
  next();
});

// ---------------------------------------------------------------------------
// Instance method: compare candidate password against stored hash
// ---------------------------------------------------------------------------
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
