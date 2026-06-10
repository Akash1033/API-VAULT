// Path: src/middleware/notFound.ts
// Purpose: Catches unmatched routes and forwards a 404 AppError to the error handler
// Dependencies: AppError, catchAsync

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
}
