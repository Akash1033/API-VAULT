// Path: src/utils/AppError.ts
// Purpose: Centralized error class for all operational errors in the application
// Dependencies: common.types (HttpStatusCode, ErrorCode)

import { HttpStatusCode, ErrorCode } from '../types/common.types.js';

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: ReadonlyArray<Record<string, unknown>>;

  constructor(
    message: string,
    statusCode: HttpStatusCode,
    errorCode: ErrorCode,
    isOperational: boolean = true,
    details?: ReadonlyArray<Record<string, unknown>>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message: string = 'Bad request',
    details?: ReadonlyArray<Record<string, unknown>>
  ): AppError {
    return new AppError(message, HttpStatusCode.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, true, details);
  }

  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, HttpStatusCode.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR);
  }

  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, HttpStatusCode.FORBIDDEN, ErrorCode.AUTHORIZATION_ERROR);
  }

  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, HttpStatusCode.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  static conflict(message: string = 'Resource already exists'): AppError {
    return new AppError(message, HttpStatusCode.CONFLICT, ErrorCode.CONFLICT);
  }

  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, HttpStatusCode.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, false);
  }

  static rateLimited(message: string = 'Too many requests'): AppError {
    return new AppError(message, HttpStatusCode.TOO_MANY_REQUESTS, ErrorCode.RATE_LIMIT_EXCEEDED);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ReadonlyArray<Record<string, unknown>>) {
    super(message, HttpStatusCode.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, true, details);
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, HttpStatusCode.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, HttpStatusCode.NOT_FOUND, ErrorCode.NOT_FOUND);
  }
}
