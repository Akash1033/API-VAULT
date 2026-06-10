// Path: src/utils/token.utils.ts
// Purpose: JWT token generation, verification, and cookie management utilities
// Dependencies: jsonwebtoken, env config, auth.types

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Response } from 'express';
import { env } from '../config/env.js';
import type { ITokenPayload } from '../types/auth.types.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function parseExpiresInMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? 1000);
}

function parseExpiresInSeconds(expiresIn: string): number {
  return Math.floor(parseExpiresInMs(expiresIn) / 1000);
}

export function generateAccessToken(payload: ITokenPayload): string {
  return jwt.sign(
    { userId: payload.userId, role: payload.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: parseExpiresInSeconds(env.JWT_ACCESS_EXPIRES_IN) }
  );
}

export function generateRefreshToken(payload: ITokenPayload): string {
  const randomStr = crypto.randomBytes(64).toString('hex');
  return `${payload.userId}::${randomStr}`;
}

export function verifyAccessToken(token: string): ITokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  return {
    userId: decoded.userId as string,
    role: decoded.role as ITokenPayload['role'],
  };
}

export function getRefreshTokenExpiryDate(): Date {
  const ms = parseExpiresInMs(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + ms);
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  const maxAgeMs = parseExpiresInMs(env.JWT_REFRESH_EXPIRES_IN);

  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/api/v1/auth',
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
  });
}

export function getRefreshTokenFromCookie(cookies: Record<string, string>): string | undefined {
  return cookies[REFRESH_COOKIE_NAME] as string | undefined;
}
