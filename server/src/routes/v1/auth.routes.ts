// Path: src/routes/v1/auth.routes.ts
// Purpose: Authentication route definitions — register, login, refresh, logout, me
// Dependencies: express, auth.controller, auth.middleware, validate, rateLimiter, auth.validators

import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, loginSchema } from '../../validators/auth.validators.js';
import {
  register,
  login,
  refresh,
  logout,
  me,
} from '../../controllers/auth.controller.js';

const router: Router = Router();

// POST /api/v1/auth/register — Public, rate-limited, validated
router.post(
  '/register',
  registerLimiter,
  validateRequest({ body: registerSchema }),
  register
);

// POST /api/v1/auth/login — Public, rate-limited, validated
router.post(
  '/login',
  loginLimiter,
  validateRequest({ body: loginSchema }),
  login
);

// POST /api/v1/auth/refresh — Public (uses HTTP-only cookie)
router.post('/refresh', refresh);

// POST /api/v1/auth/logout — Protected
router.post('/logout', requireAuth, logout);

// GET /api/v1/auth/me — Protected
router.get('/me', requireAuth, me);

export { router as authRouter };
