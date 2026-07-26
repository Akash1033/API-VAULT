// Path: src/routes/v1/index.ts
// Purpose: Route aggregator mounting all v1 sub-routers under a single v1 router
// Dependencies: express, all v1 route modules, analytics middleware, maintenance middleware

import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { projectRouter } from './project.routes.js';
import { skillRouter } from './skill.routes.js';
import { experienceRouter } from './experience.routes.js';
import { certificationRouter } from './certification.routes.js';
import { articleRouter } from './article.routes.js';
import contactRoutes from './contact.routes.js';
import uploadRoutes from './upload.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import analyticsRoutes from './analytics.routes.js';
import paymentRoutes from './payment.routes.js';
import { settingsRouter } from './settings.routes.js';
import { trackApiRequest } from '../../middleware/analytics.middleware.js';
import { maintenanceCheck } from '../../middleware/maintenance.middleware.js';

const router: Router = Router();

// Track all public API GET requests (fires AFTER response via res.on('finish'))
router.use(trackApiRequest);

// Maintenance mode gate — blocks public routes with 503 when enabled.
// Runs after analytics tracking but before route handlers.
// Auth, settings, dashboard, upload, health, and admin-only endpoints are excluded.
router.use(maintenanceCheck);

// Resource routes
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/settings', settingsRouter);
router.use('/projects', projectRouter);
router.use('/skills', skillRouter);
router.use('/experience', experienceRouter);
router.use('/certifications', certificationRouter);
router.use('/articles', articleRouter);
router.use('/contact', contactRoutes);
router.use('/upload', uploadRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payment', paymentRoutes);

export { router as v1Router };
