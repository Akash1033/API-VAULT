// Path: src/middleware/auth.middleware.ts
// Purpose: JWT authentication and role-based authorization middleware
// Dependencies: token.utils, AppError, auth.types

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/token.utils.js';
import { UserRole } from '../types/auth.types.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(AppError.unauthorized('Access token is required. Provide it as: Authorization: Bearer <token>'));
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    next(AppError.unauthorized('Access token is malformed'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    next(AppError.unauthorized('Access token is invalid or expired'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(AppError.unauthorized('Authentication required'));
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    next(AppError.forbidden('Admin access required'));
    return;
  }

  next();
}
