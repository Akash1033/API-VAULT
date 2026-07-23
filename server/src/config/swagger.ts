// Path: src/config/swagger.ts
// Purpose: OpenAPI 3.0 spec generation from existing Zod validators — single source of truth
// Dependencies: @asteasolutions/zod-to-openapi, zod, swagger-ui-express, all validators

import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Patch Zod BEFORE importing any validators that might use .openapi()
extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Validator imports (all unchanged — we wrap them here with .openapi() metadata)
// ---------------------------------------------------------------------------
import { registerSchema, loginSchema } from '../validators/auth.validators.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validators.js';
import { createSkillSchema, updateSkillSchema } from '../validators/skill.validators.js';
import { createExperienceSchema, updateExperienceSchema } from '../validators/experience.validators.js';
import { createCertificationSchema, updateCertificationSchema } from '../validators/certification.validators.js';
import { createArticleSchema, updateArticleSchema } from '../validators/article.validators.js';
import { createContactSchema } from '../validators/contact.validator.js';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator.js';
import { trackEventSchema, statsQuerySchema } from '../validators/analytics.validators.js';

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const registry = new OpenAPIRegistry();

// ---------------------------------------------------------------------------
// Security scheme — matches auth.middleware.ts requireAuth (Bearer JWT)
// ---------------------------------------------------------------------------
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT access token obtained from POST /api/v1/auth/login',
});

// ---------------------------------------------------------------------------
// Reusable response schemas (mirrors IApiResponse<T> from common.types.ts)
// ---------------------------------------------------------------------------
const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.any(),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }).optional(),
  requestId: z.string().optional(),
});

const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  statusCode: z.number(),
  message: z.string(),
  errorCode: z.string(),
  details: z.array(z.record(z.unknown())).optional(),
  requestId: z.string().optional(),
});

registry.register('ApiSuccessResponse', ApiSuccessResponseSchema);
registry.register('ApiErrorResponse', ApiErrorResponseSchema);

// ---------------------------------------------------------------------------
// Helper: Standard responses object for reuse
// ---------------------------------------------------------------------------
const successResponse = (description: string) => ({
  200: { description },
});

const createdResponse = (description: string) => ({
  201: { description },
});

const standardErrors = {
  400: { description: 'Validation error' },
  401: { description: 'Authentication required' },
  403: { description: 'Admin access required' },
  404: { description: 'Resource not found' },
  429: { description: 'Rate limit exceeded' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH — 5 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  summary: 'Register a new admin account',
  description: 'Creates a new user account. Rate-limited to 10 attempts per IP per hour.',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: registerSchema } } },
  },
  responses: {
    ...createdResponse('Registration successful — returns user object + access token. Refresh token set as HTTP-only cookie.'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  summary: 'Admin login',
  description: 'Authenticates with email/password. Rate-limited to 5 attempts per IP per 15 minutes.',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: loginSchema } } },
  },
  responses: {
    ...successResponse('Login successful — returns user object + access token. Refresh token set as HTTP-only cookie.'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  summary: 'Refresh access token',
  description: 'Uses the HTTP-only refresh token cookie to issue a new access token + rotate the refresh token.',
  tags: ['Auth'],
  responses: {
    ...successResponse('Token refreshed — new access token returned, new refresh token set as cookie.'),
    401: { description: 'Refresh token not found or expired' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  summary: 'Logout',
  description: 'Invalidates the refresh token and clears the cookie.',
  tags: ['Auth'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('Logged out successfully'),
    401: { description: 'Authentication required' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  summary: 'Get current user profile',
  description: 'Returns the authenticated user\'s profile information.',
  tags: ['Auth'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('User profile retrieved'),
    401: { description: 'Authentication required' },
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS — 5 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects',
  summary: 'List all projects',
  description: 'Returns paginated list of projects. Cached for 5 minutes. Supports filtering by tags, published status, and featured flag.',
  tags: ['Projects'],
  request: {
    params: z.object({}),
    query: z.object({
      search: z.string().optional(),
      isPublished: z.enum(['true', 'false']).optional(),
      featured: z.enum(['true', 'false']).optional(),
      tags: z.string().optional(),
    }),
  },
  responses: {
    ...successResponse('Paginated list of projects with meta'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/projects/{id}',
  summary: 'Get project by ID or slug',
  description: 'Returns a single project. Cached for 5 minutes.',
  tags: ['Projects'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Project details'),
    404: { description: 'Project not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/projects',
  summary: 'Create a new project',
  tags: ['Projects'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createProjectSchema } } },
  },
  responses: {
    ...createdResponse('Project created'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/projects/{id}',
  summary: 'Update a project',
  tags: ['Projects'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateProjectSchema } } },
  },
  responses: {
    ...successResponse('Project updated'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/projects/{id}',
  summary: 'Delete a project',
  tags: ['Projects'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Project deleted'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// SKILLS — 5 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/skills',
  summary: 'List all skills',
  description: 'Returns paginated list of skills. Cached for 5 minutes.',
  tags: ['Skills'],
  responses: {
    ...successResponse('Paginated list of skills'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/skills/{id}',
  summary: 'Get skill by ID',
  tags: ['Skills'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Skill details'),
    404: { description: 'Skill not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/skills',
  summary: 'Create a new skill',
  tags: ['Skills'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createSkillSchema } } },
  },
  responses: {
    ...createdResponse('Skill created'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/skills/{id}',
  summary: 'Update a skill',
  tags: ['Skills'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateSkillSchema } } },
  },
  responses: {
    ...successResponse('Skill updated'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/skills/{id}',
  summary: 'Delete a skill',
  tags: ['Skills'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Skill deleted'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE — 5 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/experience',
  summary: 'List all experience entries',
  description: 'Returns paginated list. Rate-limited and cached for 5 minutes.',
  tags: ['Experience'],
  responses: {
    ...successResponse('Paginated list of experience entries'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/experience/{id}',
  summary: 'Get experience by ID',
  tags: ['Experience'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Experience details'),
    404: { description: 'Experience not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/experience',
  summary: 'Create a new experience entry',
  tags: ['Experience'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createExperienceSchema } } },
  },
  responses: {
    ...createdResponse('Experience created'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/experience/{id}',
  summary: 'Update an experience entry',
  tags: ['Experience'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateExperienceSchema } } },
  },
  responses: {
    ...successResponse('Experience updated'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/experience/{id}',
  summary: 'Delete an experience entry',
  tags: ['Experience'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Experience deleted'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CERTIFICATIONS — 4 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/certifications',
  summary: 'List all certifications',
  description: 'Returns paginated list. Cached for 5 minutes.',
  tags: ['Certifications'],
  responses: {
    ...successResponse('Paginated list of certifications'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/certifications',
  summary: 'Create a new certification',
  tags: ['Certifications'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createCertificationSchema } } },
  },
  responses: {
    ...createdResponse('Certification created'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/certifications/{id}',
  summary: 'Update a certification',
  tags: ['Certifications'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateCertificationSchema } } },
  },
  responses: {
    ...successResponse('Certification updated'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/certifications/{id}',
  summary: 'Delete a certification',
  tags: ['Certifications'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Certification deleted'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES — 7 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles',
  summary: 'List all articles',
  description: 'Returns paginated list. Cached for 5 minutes.',
  tags: ['Articles'],
  responses: {
    ...successResponse('Paginated list of articles'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles/slug/{slug}',
  summary: 'Get article by slug',
  description: 'Looks up article by its URL-friendly slug. Cached for 5 minutes.',
  tags: ['Articles'],
  request: { params: z.object({ slug: z.string() }) },
  responses: {
    ...successResponse('Article details'),
    404: { description: 'Article not found' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/articles/{id}',
  summary: 'Get article by ID',
  tags: ['Articles'],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Article details'),
    404: { description: 'Article not found' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/articles',
  summary: 'Create a new article',
  tags: ['Articles'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: { content: { 'application/json': { schema: createArticleSchema } } },
  },
  responses: {
    ...createdResponse('Article created'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/articles/{id}',
  summary: 'Update an article',
  tags: ['Articles'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateArticleSchema } } },
  },
  responses: {
    ...successResponse('Article updated'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/articles/{id}/publish',
  summary: 'Toggle article publish status',
  tags: ['Articles'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Article publish status toggled'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/articles/{id}',
  summary: 'Delete an article',
  tags: ['Articles'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Article deleted'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT — 6 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'post',
  path: '/api/v1/contact',
  summary: 'Submit a contact message',
  description: 'Public endpoint. Rate-limited to 3 per hour per IP.',
  tags: ['Contact'],
  request: {
    body: { content: { 'application/json': { schema: createContactSchema } } },
  },
  responses: {
    ...createdResponse('Message sent successfully'),
    400: { description: 'Validation error' },
    429: { description: 'Rate limit exceeded — max 3 messages per hour' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/contact',
  summary: 'List all contact messages',
  tags: ['Contact'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('List of contact messages'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/contact/{id}',
  summary: 'Get a contact message by ID',
  tags: ['Contact'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Contact message details'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/contact/{id}/read',
  summary: 'Mark message as read',
  tags: ['Contact'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Message marked as read'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/contact/{id}/unread',
  summary: 'Mark message as unread',
  tags: ['Contact'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Message marked as unread'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/contact/{id}',
  summary: 'Delete a contact message',
  tags: ['Contact'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Message deleted'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// PAYMENT — 7 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'post',
  path: '/api/v1/payment/order',
  summary: 'Create a Razorpay payment order',
  description: 'Creates a payment order. Rate-limited to 10 per IP per 15 min. Idempotency guard prevents duplicate orders within 1 minute.',
  tags: ['Payment'],
  request: {
    body: { content: { 'application/json': { schema: createOrderSchema } } },
  },
  responses: {
    ...createdResponse('Razorpay order created — returns order_id for frontend checkout'),
    ...standardErrors,
    409: { description: 'Duplicate payment request within 1 minute' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/payment/verify',
  summary: 'Verify a payment after Razorpay checkout',
  description: 'Defence-in-depth verification of the Razorpay payment signature from the frontend callback.',
  tags: ['Payment'],
  request: {
    body: { content: { 'application/json': { schema: verifyPaymentSchema } } },
  },
  responses: {
    ...successResponse('Payment verified successfully'),
    400: { description: 'Invalid signature or payment verification failed' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/payment/webhook',
  summary: 'Razorpay webhook handler',
  description: 'Receives Razorpay server-to-server webhook events. Verifies HMAC signature using raw body. Not callable from Swagger UI.',
  tags: ['Payment'],
  responses: {
    ...successResponse('Webhook processed'),
    400: { description: 'Invalid webhook signature' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/payment/donor-wall',
  summary: 'Get public donor wall',
  description: 'Returns list of donors who opted to appear on the public donor wall.',
  tags: ['Payment'],
  responses: {
    ...successResponse('Donor wall entries'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/payment/admin',
  summary: 'Get all payments (admin)',
  tags: ['Payment'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('All payment records'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/payment/stats',
  summary: 'Get revenue statistics (admin)',
  tags: ['Payment'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('Revenue statistics'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/payment/resend-email/{id}',
  summary: 'Resend payment confirmation email (admin)',
  tags: ['Payment'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    ...successResponse('Email resent'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS — 4 endpoints
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'post',
  path: '/api/v1/analytics/track',
  summary: 'Track an analytics event',
  description: 'Public endpoint used by the frontend to log page views and interactions. Rate-limited to 20 per minute per IP.',
  tags: ['Analytics'],
  request: {
    body: { content: { 'application/json': { schema: trackEventSchema } } },
  },
  responses: {
    ...createdResponse('Event tracked'),
    429: { description: 'Rate limit exceeded' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/stats',
  summary: 'Get aggregated analytics stats (admin)',
  description: 'Returns analytics metrics with optional comparison period.',
  tags: ['Analytics'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    query: statsQuerySchema,
  },
  responses: {
    ...successResponse('Aggregated statistics'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/live',
  summary: 'Get live stats snapshot (admin)',
  tags: ['Analytics'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('Live statistics snapshot'),
    ...standardErrors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/analytics/stream',
  summary: 'Live stats SSE stream',
  description: 'Server-Sent Events stream pushing live stats every 5 seconds. Auth is via query parameter token (EventSource API cannot send headers). Not testable from Swagger UI.',
  tags: ['Analytics'],
  request: {
    query: z.object({
      token: z.string(),
    }),
  },
  responses: {
    200: { description: 'SSE stream — Content-Type: text/event-stream' },
    401: { description: 'Invalid or missing token' },
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — 1 endpoint
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/overview',
  summary: 'Get dashboard overview stats (admin)',
  description: 'Returns aggregate counts for the admin dashboard homepage.',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    ...successResponse('Dashboard overview statistics'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD — 1 endpoint
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'post',
  path: '/api/v1/upload/image',
  summary: 'Upload an image (admin)',
  description: 'Uploads an image to Cloudinary. Max 5 MB. Accepts multipart/form-data with a single "image" field.',
  tags: ['Upload'],
  security: [{ [bearerAuth.name]: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            image: z.any(),
          }),
        },
      },
    },
  },
  responses: {
    ...successResponse('Image uploaded — returns Cloudinary URL'),
    ...standardErrors,
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH — 1 endpoint (registered under both /api/v1/health and /api/health)
// ═══════════════════════════════════════════════════════════════════════════════

registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  summary: 'Health check',
  description: 'Returns server health status. Also available at /api/health (without rate limiting).',
  tags: ['Health'],
  responses: {
    ...successResponse('Server is healthy'),
  },
});

// ---------------------------------------------------------------------------
// Document generator
// ---------------------------------------------------------------------------
export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      version: '1.0.0',
      title: 'Portfolio API',
      description:
        'Production-grade portfolio backend API with authentication, CRUD resources, payments, analytics, and file uploads.\n\n' +
        '## Authentication\n' +
        'Most admin endpoints require a JWT Bearer token. Obtain one via `POST /api/v1/auth/login`, ' +
        'then click the **Authorize** button above and enter: `<your-access-token>`.\n\n' +
        '## Rate Limiting\n' +
        'All endpoints are rate-limited. Public endpoints have stricter limits (e.g., 3 contact messages/hour, 5 login attempts/15min).',
    },
    servers: [
      { url: '/', description: 'Current server' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Projects', description: 'Portfolio project CRUD' },
      { name: 'Skills', description: 'Technical skills CRUD' },
      { name: 'Experience', description: 'Work experience CRUD' },
      { name: 'Certifications', description: 'Professional certifications CRUD' },
      { name: 'Articles', description: 'Blog articles CRUD' },
      { name: 'Contact', description: 'Contact form & message management' },
      { name: 'Payment', description: 'Razorpay payment processing & donor wall' },
      { name: 'Analytics', description: 'Event tracking & admin analytics' },
      { name: 'Dashboard', description: 'Admin dashboard overview' },
      { name: 'Upload', description: 'Image upload to Cloudinary' },
      { name: 'Health', description: 'Server health checks' },
    ],
  });
}
