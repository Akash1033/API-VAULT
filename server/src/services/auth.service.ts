// Path: src/services/auth.service.ts
// Purpose: Authentication business logic — register, login, refresh, logout
// Dependencies: User model, RefreshToken model, token.utils, AppError, bcryptjs

import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
} from '../utils/token.utils.js';
import type {
  IAuthResponse,
  IAuthTokens,
  ITokenPayload,
  IUserDocument,
} from '../types/auth.types.js';

const BCRYPT_ROUNDS = 12;

interface RegisterInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

interface LoginInput {
  readonly email: string;
  readonly password: string;
}

interface RefreshInput {
  readonly token: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

async function storeRefreshToken(
  userId: string,
  rawToken: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const tokenHash = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
  const expiresAt = getRefreshTokenExpiryDate();

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  });
}

function generateTokenPair(payload: ITokenPayload): IAuthTokens {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

function buildAuthResponse(user: IUserDocument, accessToken: string): IAuthResponse {
  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
  };
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export async function register(
  data: RegisterInput,
  ipAddress: string,
  userAgent: string
): Promise<{ authResponse: IAuthResponse; refreshToken: string }> {
  const existingUser = await User.findOne({ email: data.email }).lean();

  if (existingUser) {
    throw AppError.conflict('A user with this email already exists');
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
  });

  const payload: ITokenPayload = { userId: user._id.toString(), role: user.role };
  const tokens = generateTokenPair(payload);

  await storeRefreshToken(user._id.toString(), tokens.refreshToken, ipAddress, userAgent);

  logger.info('User registered', { userId: user._id.toString(), email: user.email });

  return {
    authResponse: buildAuthResponse(user, tokens.accessToken),
    refreshToken: tokens.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export async function login(
  data: LoginInput,
  ipAddress: string,
  userAgent: string
): Promise<{ authResponse: IAuthResponse; refreshToken: string }> {
  // Explicitly select password since it's select:false on the schema
  const user = await User.findOne({ email: data.email, isActive: true }).select('+password');

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(data.password);

  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const payload: ITokenPayload = { userId: user._id.toString(), role: user.role };
  const tokens = generateTokenPair(payload);

  await storeRefreshToken(user._id.toString(), tokens.refreshToken, ipAddress, userAgent);

  logger.info('User logged in', { userId: user._id.toString(), email: user.email });

  return {
    authResponse: buildAuthResponse(user, tokens.accessToken),
    refreshToken: tokens.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Refresh Tokens (Rotation)
// ---------------------------------------------------------------------------
export async function refreshTokens(
  data: RefreshInput
): Promise<{ authResponse: IAuthResponse; refreshToken: string }> {
  // 1. Verify format
  const parts = data.token.split('::');
  if (parts.length !== 2) {
    throw AppError.unauthorized('Refresh token is malformed');
  }
  const userId = parts[0];

  // 2. Find all refresh tokens for this user
  const storedTokens = await RefreshToken.find({ userId });

  if (storedTokens.length === 0) {
    // No tokens at all — possible token reuse attack after logout
    logger.warn('Refresh token reuse detected — no tokens in DB', {
      userId,
    });
    throw AppError.unauthorized('Refresh token has been revoked');
  }

  // 3. Find the matching token by comparing hashes
  let matchedTokenId: string | null = null;

  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(data.token, stored.tokenHash);
    if (isMatch) {
      matchedTokenId = stored._id.toString();
      break;
    }
  }

  if (!matchedTokenId) {
    // Token was formatted correctly but not in DB — stolen token replayed after rotation
    logger.warn('Refresh token reuse detected — token not found in DB. Revoking all tokens for user.', {
      userId,
    });
    // Security: revoke ALL tokens for this user (potential compromise)
    await RefreshToken.deleteMany({ userId });
    throw AppError.unauthorized('Refresh token has been revoked. All sessions terminated for security.');
  }

  // 4. Delete the old token (rotation)
  await RefreshToken.findByIdAndDelete(matchedTokenId);

  // 5. Verify user still exists and is active
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    await RefreshToken.deleteMany({ userId });
    throw AppError.unauthorized('User account is deactivated or does not exist');
  }

  // 6. Generate new token pair
  const newPayload: ITokenPayload = { userId: user._id.toString(), role: user.role };
  const tokens = generateTokenPair(newPayload);

  // 7. Store the new refresh token
  await storeRefreshToken(user._id.toString(), tokens.refreshToken, data.ipAddress, data.userAgent);

  logger.info('Tokens refreshed', { userId: user._id.toString() });

  return {
    authResponse: buildAuthResponse(user, tokens.accessToken),
    refreshToken: tokens.refreshToken,
  };
}

// ---------------------------------------------------------------------------
// Logout (single session)
// ---------------------------------------------------------------------------
export async function logout(refreshTokenRaw: string): Promise<void> {
  const parts = refreshTokenRaw.split('::');
  if (parts.length !== 2) {
    return;
  }
  const userId = parts[0];

  const storedTokens = await RefreshToken.find({ userId });

  for (const stored of storedTokens) {
    const isMatch = await bcrypt.compare(refreshTokenRaw, stored.tokenHash);
    if (isMatch) {
      await RefreshToken.findByIdAndDelete(stored._id);
      logger.info('User logged out', { userId });
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// Logout All (all sessions for a user)
// ---------------------------------------------------------------------------
export async function logoutAll(userId: string): Promise<void> {
  const result = await RefreshToken.deleteMany({ userId });
  logger.info('All sessions terminated', { userId, deletedCount: result.deletedCount });
}

// ---------------------------------------------------------------------------
// Get Current User
// ---------------------------------------------------------------------------
export async function getCurrentUser(userId: string): Promise<IAuthResponse['user']> {
  const user = await User.findById(userId).lean();

  if (!user || !user.isActive) {
    throw AppError.notFound('User');
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
