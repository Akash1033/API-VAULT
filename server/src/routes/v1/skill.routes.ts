// Path: src/routes/v1/skill.routes.ts
// Purpose: Skill resource routes — public reads, admin-only writes
// Dependencies: express, skill.controller, middleware

import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { paginate } from '../../middleware/paginate.middleware.js';
import { cacheRoute, invalidateCache } from '../../middleware/cache.middleware.js';
import { createSkillSchema, updateSkillSchema } from '../../validators/skill.validators.js';
import { getAllSkills, getSkillById, createSkill, updateSkill, deleteSkill } from '../../controllers/skill.controller.js';

const router: Router = Router();

// Public routes
router.get('/', cacheRoute(300), paginate, getAllSkills);
router.get('/:id', cacheRoute(300), getSkillById);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, validateRequest({ body: createSkillSchema }), invalidateCache('/api/v1/skills'), createSkill);
router.put('/:id', requireAuth, requireAdmin, validateRequest({ body: updateSkillSchema }), invalidateCache('/api/v1/skills'), updateSkill);
router.delete('/:id', requireAuth, requireAdmin, invalidateCache('/api/v1/skills'), deleteSkill);

export { router as skillRouter };
