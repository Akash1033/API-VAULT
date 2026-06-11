// Path: server.ts
// Purpose: Application entry point — validates env, connects DB, starts HTTP server
// Dependencies: env config, db config, app, logger

import { env } from './src/config/env.js';
import { connectDB, registerShutdownHooks } from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import { app } from './src/app.js';
import { logger } from './src/utils/logger.js';
import { logRegisteredRoutes } from './src/utils/logRoutes.js';
import { runRetentionCleanup } from './src/utils/analyticsRetention.js';

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to MongoDB (retry logic is inside connectDB)
    await connectDB();

    // 2. Connect to Redis (optional — app works without it)
    await connectRedis();

    // 3. Register graceful shutdown hooks
    registerShutdownHooks();

    // 4. Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`, {
        environment: env.NODE_ENV,
        port: env.PORT,
      });
      // Run analytics retention cleanup on startup
      void runRetentionCleanup();
      logRegisteredRoutes(app);
    });

    // 5. Handle server-level errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${env.PORT} is already in use`);
        process.exit(1);
      }
      throw error;
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    logger.error('❌ Failed to start server', { error: message });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('UNCAUGHT EXCEPTION — shutting down', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  logger.error('UNHANDLED REJECTION — shutting down', { error: message });
  process.exit(1);
});

bootstrap();
