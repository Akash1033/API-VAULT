// Path: src/middleware/paginate.middleware.ts
// Purpose: Reusable pagination middleware — parses query params into typed IPaginationOptions
// Dependencies: common.types

import type { Request, Response, NextFunction } from 'express';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT = 'createdAt';
const DEFAULT_ORDER = 'desc' as const;

export function paginate(req: Request, _res: Response, next: NextFunction): void {
  const page = Math.max(1, parseInt(req.query['page'] as string, 10) || DEFAULT_PAGE);
  const rawLimit = parseInt(req.query['limit'] as string, 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const sort = (req.query['sort'] as string) || DEFAULT_SORT;
  const orderParam = (req.query['order'] as string)?.toLowerCase();
  const order = orderParam === 'asc' ? 'asc' : DEFAULT_ORDER;

  req.pagination = { page, limit, sort, order };

  next();
}
