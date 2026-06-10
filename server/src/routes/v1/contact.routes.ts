// Path: src/routes/v1/contact.routes.ts
import { Router } from 'express';
import {
  createContact,
  getAllMessages,
  getMessageById,
  markAsRead,
  markAsUnread,
  deleteMessage
} from '../../controllers/contact.controller.js';
import { requireAuth, requireAdmin as authorize } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { createContactSchema } from '../../validators/contact.validator.js';
import { globalLimiter } from '../../middleware/rateLimiter.js';
import rateLimit from 'express-rate-limit';

const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Too many messages sent. Please try again in an hour.' }]
  },
  standardHeaders: true,
  legacyHeaders: false
});

const router = Router();

router.post(
  '/',
  contactFormLimiter,
  validateRequest({ body: createContactSchema }),
  createContact
);

router.get(
  '/',
  globalLimiter,
  requireAuth,
  authorize,
  getAllMessages
);

router.get(
  '/:id',
  globalLimiter,
  requireAuth,
  authorize,
  getMessageById
);

router.patch(
  '/:id/read',
  globalLimiter,
  requireAuth,
  authorize,
  markAsRead
);

router.patch(
  '/:id/unread',
  globalLimiter,
  requireAuth,
  authorize,
  markAsUnread
);

router.delete(
  '/:id',
  globalLimiter,
  requireAuth,
  authorize,
  deleteMessage
);

export default router;
