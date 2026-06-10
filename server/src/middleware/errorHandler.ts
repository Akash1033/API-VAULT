// Path: src/middleware/errorHandler.ts
// Purpose: Global Express error handler — maps all error types to standardized JSON responses
// Dependencies: AppError, logger, common.types, zod

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { HttpStatusCode, ErrorCode } from '../types/common.types.js';

interface ErrorResponseBody {
  readonly success: false;
  readonly statusCode: number;
  readonly message: string;
  readonly errorCode: string;
  readonly details?: ReadonlyArray<Record<string, unknown>>;
  readonly stack?: string;
  readonly requestId?: string;
}

function handleMongooseValidationError(error: mongoose.Error.ValidationError): AppError {
  const details = Object.values(error.errors).map((err) => ({
    field: err.path,
    message: err.message,
    value: err.value as unknown,
  }));

  return new AppError(
    'Validation failed',
    HttpStatusCode.BAD_REQUEST,
    ErrorCode.VALIDATION_ERROR,
    true,
    details
  );
}

function handleMongooseCastError(error: mongoose.Error.CastError): AppError {
  return new AppError(
    `Invalid ${error.path}: ${error.value as string}`,
    HttpStatusCode.BAD_REQUEST,
    ErrorCode.VALIDATION_ERROR
  );
}

function handleMongoDuplicateKeyError(error: Record<string, unknown>): AppError {
  const keyValue = error['keyValue'] as Record<string, unknown> | undefined;
  const field = keyValue ? Object.keys(keyValue)[0] : 'unknown';

  return new AppError(
    `Duplicate value for field: ${field ?? 'unknown'}`,
    HttpStatusCode.CONFLICT,
    ErrorCode.CONFLICT
  );
}

function handleZodError(error: ZodError): AppError {
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return new AppError(
    'Request validation failed',
    HttpStatusCode.BAD_REQUEST,
    ErrorCode.VALIDATION_ERROR,
    true,
    details
  );
}

function handleJwtError(): AppError {
  return AppError.unauthorized('Invalid or expired token');
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleMongooseValidationError(err);
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleMongooseCastError(err);
  } else if ((err as unknown as Record<string, unknown>)['code'] === 11000) {
    error = handleMongoDuplicateKeyError(err as unknown as Record<string, unknown>);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJwtError();
  } else {
    error = AppError.internal(err.message || 'An unexpected error occurred');
  }

  // Log the error
  const logPayload = {
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    message: error.message,
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: error.stack,
  };

  if (error.isOperational) {
    logger.warn('Operational error', logPayload);
  } else {
    logger.error('CRITICAL: Non-operational error', logPayload);
  }

  const isProduction = process.env['NODE_ENV'] === 'production';

  const response: ErrorResponseBody = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errorCode: error.errorCode,
    details: error.details,
    stack: isProduction ? undefined : error.stack,
    requestId: req.requestId,
  };

  res.status(error.statusCode).json(response);
}
