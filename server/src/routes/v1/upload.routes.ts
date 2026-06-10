// Path: src/routes/v1/upload.routes.ts
// Purpose: Upload routes
// Dependencies: express

import { Router } from 'express';
import { uploadProjectImage } from '../../controllers/upload.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { uploadImage } from '../../middleware/upload.middleware.js';

const router = Router();

router.post(
  '/image',
  requireAuth,
  requireAdmin,
  uploadImage.single('image'),
  uploadProjectImage
);

export default router;
