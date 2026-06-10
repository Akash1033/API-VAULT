// Path: src/routes/v1/health.routes.ts
// Purpose: Health check route — GET /api/v1/health
// Dependencies: express, health.controller

import { Router } from 'express';
import { checkHealth } from '../../controllers/health.controller.js';

const router: Router = Router();

// GET /api/v1/health — Public endpoint, no auth required
router.get('/', checkHealth);

export { router as healthRouter };
