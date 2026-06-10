// Path: src/middleware/requestId.ts
// Purpose: Attaches a unique UUID to every incoming request for distributed tracing
// Dependencies: uuid, express

import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  req.requestId = typeof existingId === 'string' && existingId.length > 0
    ? existingId
    : uuidv4();

  res.setHeader('X-Request-ID', req.requestId);

  next();
}
