// Path: src/models/refreshToken.model.ts
// Purpose: Mongoose schema for storing hashed refresh tokens with TTL auto-cleanup
// Dependencies: mongoose, auth.types

import mongoose, { Schema } from 'mongoose';
import type { IRefreshTokenDocument } from '../types/auth.types.js';

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------
// Look up tokens by user (multi-device support, logoutAll)
refreshTokenSchema.index({ userId: 1 });

// TTL index: MongoDB automatically deletes expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshTokenDocument>(
  'RefreshToken',
  refreshTokenSchema
);
