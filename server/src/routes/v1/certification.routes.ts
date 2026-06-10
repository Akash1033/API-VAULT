// Path: src/routes/v1/certification.routes.ts
// Purpose: Certification resource routes
// Dependencies: express, certification.controller, middleware

import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { paginate } from '../../middleware/paginate.middleware.js';
import { cacheRoute, invalidateCache } from '../../middleware/cache.middleware.js';
import { createCertificationSchema, updateCertificationSchema } from '../../validators/certification.validators.js';
import { getAllCertifications, createCertification, updateCertification, deleteCertification } from '../../controllers/certification.controller.js';

const router: Router = Router();

router.get('/', cacheRoute(300), paginate, getAllCertifications);

router.post('/', requireAuth, requireAdmin, validateRequest({ body: createCertificationSchema }), invalidateCache('/api/v1/certifications'), createCertification);
router.put('/:id', requireAuth, requireAdmin, validateRequest({ body: updateCertificationSchema }), invalidateCache('/api/v1/certifications'), updateCertification);
router.delete('/:id', requireAuth, requireAdmin, invalidateCache('/api/v1/certifications'), deleteCertification);

export { router as certificationRouter };
