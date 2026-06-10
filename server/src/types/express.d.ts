// Path: src/types/express.d.ts
// Purpose: Augment Express Request with custom properties (requestId, user, pagination)
// Dependencies: express, auth.types, common.types

import 'express';
import type { IRequestUser } from './auth.types.js';
import type { IPaginationOptions } from './common.types.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: IRequestUser;
      pagination?: IPaginationOptions;
      rawBody?: string;
    }
  }
}
