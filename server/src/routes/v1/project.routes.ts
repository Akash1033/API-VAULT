// Path: src/routes/v1/project.routes.ts
// Purpose: Project resource routes — public reads, admin-only writes
// Dependencies: express, project.controller, middleware

import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { paginate } from '../../middleware/paginate.middleware.js';
import { cacheRoute, invalidateCache } from '../../middleware/cache.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../../validators/project.validators.js';
import { getAllProjects, getProjectById, createProject, updateProject, deleteProject } from '../../controllers/project.controller.js';

const router: Router = Router();

// Public routes
router.get('/', cacheRoute(300), paginate, getAllProjects);
router.get('/:id', cacheRoute(300), getProjectById);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, validateRequest({ body: createProjectSchema }), invalidateCache('/api/v1/projects'), createProject);
router.put('/:id', requireAuth, requireAdmin, validateRequest({ body: updateProjectSchema }), invalidateCache('/api/v1/projects'), updateProject);
router.delete('/:id', requireAuth, requireAdmin, invalidateCache('/api/v1/projects'), deleteProject);

export { router as projectRouter };
