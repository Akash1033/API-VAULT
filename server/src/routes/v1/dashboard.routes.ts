// Path: src/routes/v1/dashboard.routes.ts
import { Router } from 'express';
import { getOverviewStats } from '../../controllers/dashboard.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

const router: Router = Router();

// Apply auth middleware to all dashboard routes
router.use(requireAuth);
router.use(requireAdmin);

router.get('/overview', getOverviewStats);

export default router;
