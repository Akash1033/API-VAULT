// Path: src/utils/catchAsync.ts
// Purpose: Async wrapper for Express route handlers to catch errors and forward to error middleware
// Dependencies: express

import type { Request, Response, NextFunction } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function catchAsync(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
