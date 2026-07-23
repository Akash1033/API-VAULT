// Path: src/app.ts
// Purpose: Express app setup — middleware stack, routes, error handling. No listen() here.
// Dependencies: express, helmet, cors, morgan, middleware/*, routes/*, swagger-ui-express

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { morganStream } from './utils/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { notFoundHandler } from './middleware/notFound.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { v1Router } from './routes/v1/index.js';
import { healthRouter } from './routes/v1/health.routes.js';
import { generateOpenApiDocument } from './config/swagger.js';

const app: Express = express();
app.set('trust proxy', 1);

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
// Swagger UI injects inline scripts/styles — disable CSP only for the /api/docs path.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/docs')) {
    helmet({ contentSecurityPolicy: false })(req, res, next);
  } else {
    helmet()(req, res, next);
  }
});
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  })
);

// ---------------------------------------------------------------------------
// Body parsing & sanitization
// ---------------------------------------------------------------------------
// We need the raw body for Razorpay webhook signature verification.
// Skip the global JSON parser for the webhook route, as it parses it internally.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/payment/webhook') {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
// express-mongo-sanitize default middleware reassigns req.query which breaks Express 5.
// We must mutate in place using the exported sanitize function.
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.headers) mongoSanitize.sanitize(req.headers);
  next();
});

// ---------------------------------------------------------------------------
// Request tracing & logging
// ---------------------------------------------------------------------------
app.use(requestIdMiddleware);
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: morganStream,
    skip: (_req, res) => env.NODE_ENV === 'test' || res.statusCode < 400,
  })
);

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/v1', globalLimiter, v1Router);
app.use('/api/health', healthRouter);

// ---------------------------------------------------------------------------
// API Explorer (Swagger UI) — mounted outside /api/v1 to skip rate limiter
// ---------------------------------------------------------------------------
const openApiDocument = generateOpenApiDocument();
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customSiteTitle: 'Portfolio API Explorer',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    tagsSorter: 'alpha',
  },
}));
// Serve the raw OpenAPI JSON spec
app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.json(openApiDocument);
});

// ---------------------------------------------------------------------------
// Error handling (must be last)
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(globalErrorHandler);

export { app };
