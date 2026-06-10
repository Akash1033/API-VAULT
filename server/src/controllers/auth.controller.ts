// Path: src/controllers/auth.controller.ts
// Purpose: HTTP handlers for authentication endpoints — delegates to auth.service
// Dependencies: catchAsync, ApiResponse, auth.service, token.utils

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '../utils/token.utils.js';
import {
  register as registerService,
  login as loginService,
  refreshTokens as refreshService,
  logout as logoutService,
  getCurrentUser,
} from '../services/auth.service.js';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function getClientUserAgent(req: Request): string {
  return req.headers['user-agent'] ?? 'unknown';
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------
export const register = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const ipAddress = getClientIp(req);
  const userAgent = getClientUserAgent(req);

  const result = await registerService(req.body, ipAddress, userAgent);

  setRefreshTokenCookie(res, result.refreshToken);

  ApiResponse.created(res, result.authResponse, 'Registration successful');
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------
export const login = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const ipAddress = getClientIp(req);
  const userAgent = getClientUserAgent(req);

  const result = await loginService(req.body, ipAddress, userAgent);

  setRefreshTokenCookie(res, result.refreshToken);

  ApiResponse.ok(res, result.authResponse, 'Login successful');
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/refresh
// ---------------------------------------------------------------------------
export const refresh = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const oldToken = getRefreshTokenFromCookie(req.cookies as Record<string, string>);

  if (!oldToken) {
    throw AppError.unauthorized('Refresh token not found. Please log in again.');
  }

  const ipAddress = getClientIp(req);
  const userAgent = getClientUserAgent(req);

  const result = await refreshService({
    token: oldToken,
    ipAddress,
    userAgent,
  });

  setRefreshTokenCookie(res, result.refreshToken);

  ApiResponse.ok(res, result.authResponse, 'Token refreshed successfully');
});

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout
// ---------------------------------------------------------------------------
export const logout = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const refreshToken = getRefreshTokenFromCookie(req.cookies as Record<string, string>);

  if (refreshToken) {
    await logoutService(refreshToken);
  }

  clearRefreshTokenCookie(res);

  ApiResponse.ok(res, null, 'Logged out successfully');
});

// ---------------------------------------------------------------------------
// GET /api/v1/auth/me
// ---------------------------------------------------------------------------
export const me = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw AppError.unauthorized('Authentication required');
  }

  const user = await getCurrentUser(req.user.userId);

  ApiResponse.ok(res, { user }, 'User profile retrieved');
});
