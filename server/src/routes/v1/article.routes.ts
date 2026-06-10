// Path: src/routes/v1/article.routes.ts
// Purpose: Article resource routes
// Dependencies: express, article.controller, middleware

import { Router } from 'express';
import { validateRequest } from '../../middleware/validate.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { paginate } from '../../middleware/paginate.middleware.js';
import { cacheRoute, invalidateCache } from '../../middleware/cache.middleware.js';
import { createArticleSchema, updateArticleSchema } from '../../validators/article.validators.js';
import { getAllArticles, getArticleById, getArticleBySlug, createArticle, updateArticle, deleteArticle, publishArticle } from '../../controllers/article.controller.js';

const router: Router = Router();

router.get('/', cacheRoute(300), paginate, getAllArticles);
router.get('/slug/:slug', cacheRoute(300), getArticleBySlug);
router.get('/:id', cacheRoute(300), getArticleById);

router.post('/', requireAuth, requireAdmin, validateRequest({ body: createArticleSchema }), invalidateCache('/api/v1/articles'), createArticle);
router.put('/:id', requireAuth, requireAdmin, validateRequest({ body: updateArticleSchema }), invalidateCache('/api/v1/articles'), updateArticle);
router.patch('/:id/publish', requireAuth, requireAdmin, invalidateCache('/api/v1/articles'), publishArticle);
router.delete('/:id', requireAuth, requireAdmin, invalidateCache('/api/v1/articles'), deleteArticle);

export { router as articleRouter };
