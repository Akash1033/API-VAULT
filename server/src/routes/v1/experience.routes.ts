// Path: src/routes/v1/experience.routes.ts
// Purpose: Experience resource routes
// Dependencies: express, experience.controller, middleware

import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { paginate } from '../../middleware/paginate.middleware.js';
import { cacheRoute, invalidateCache } from '../../middleware/cache.middleware.js';
import { createExperienceSchema, updateExperienceSchema } from '../../validators/experience.validators.js';
import { getAllExperience, getExperienceById, createExperience, updateExperience, deleteExperience } from '../../controllers/experience.controller.js';
import { globalLimiter } from '../../middleware/rateLimiter.js';

const router: Router = Router();

router.get('/', globalLimiter, cacheRoute(300), paginate, getAllExperience);
router.get('/:id', globalLimiter, cacheRoute(300), getExperienceById);

router.post('/', globalLimiter, requireAuth, requireAdmin, validateRequest({ body: createExperienceSchema }), invalidateCache('/api/v1/experience'), createExperience);
router.put('/:id', globalLimiter, requireAuth, requireAdmin, validateRequest({ body: updateExperienceSchema }), invalidateCache('/api/v1/experience'), updateExperience);
router.delete('/:id', globalLimiter, requireAuth, requireAdmin, invalidateCache('/api/v1/experience'), deleteExperience);

export { router as experienceRouter };
export default router;
