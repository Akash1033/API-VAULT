// Path: src/routes/v1/settings.routes.ts
// Purpose: Settings routes — public maintenance status read + admin-only maintenance toggle
// Dependencies: express, settings.controller, auth.middleware, validate, cache.middleware

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { cacheRoute } from '../../middleware/cache.middleware.js';
import { updateMaintenanceSchema } from '../../validators/settings.validators.js';
import {
  getMaintenanceStatus,
  updateMaintenanceStatus,
} from '../../controllers/settings.controller.js';

const router: Router = Router();

// GET /api/v1/settings/maintenance — Public, short cache
router.get('/maintenance', cacheRoute(10), getMaintenanceStatus);

// PATCH /api/v1/settings/maintenance — Admin-only, validated
router.patch(
  '/maintenance',
  requireAuth,
  requireAdmin,
  validateRequest({ body: updateMaintenanceSchema }),
  updateMaintenanceStatus
);

export { router as settingsRouter };
