// Path: src/middleware/validate.ts
// Purpose: Generic Zod validation middleware factory for req.body, req.query, req.params
// Dependencies: zod, AppError, common.types

import type { Request, Response, NextFunction } from 'express';
import { type AnyZodObject, type ZodEffects, ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';
import { HttpStatusCode, ErrorCode } from '../types/common.types.js';

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidationSchemas {
  readonly body?: ZodSchema;
  readonly query?: ZodSchema;
  readonly params?: ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, 'query', { value: parsedQuery, writable: true, enumerable: true, configurable: true });
      }

      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        Object.defineProperty(req, 'params', { value: parsedParams, writable: true, enumerable: true, configurable: true });
      }

      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        next(
          new AppError(
            'Request validation failed',
            HttpStatusCode.BAD_REQUEST,
            ErrorCode.VALIDATION_ERROR,
            true,
            details
          )
        );
        return;
      }

      next(error);
    }
  };
}
