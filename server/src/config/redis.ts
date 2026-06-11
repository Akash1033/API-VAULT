// Path: src/config/redis.ts
// Purpose: Optional Redis connection setup using ioredis
// Dependencies: ioredis, env config, logger

import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;

/**
 * Check if Redis is currently connected and usable.
 */
export function isRedisAvailable(): boolean {
  return redis !== null && redis.status === 'ready';
}

/**
 * Attempt to connect to Redis. If REDIS_URL is missing or connection fails,
 * log a single warning and continue without Redis.
 * The application will fall back to database-only operation.
 */
export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    logger.warn('⚠️  REDIS_URL not configured — running without Redis (cache disabled)');
    return;
  }

  try {
    const instance = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      // Do NOT auto-retry connection indefinitely — fail fast on startup
      retryStrategy(times) {
        if (times > 3) {
          // Return null to stop retrying
          return null;
        }
        return Math.min(times * 200, 1000);
      },
      // Prevent reconnect loops when Redis goes down after initial connect
      reconnectOnError: () => false,
    });

    // Suppress default error events from crashing the process
    instance.on('error', () => {
      // Errors are handled in the catch below or silently ignored post-connect
    });

    // Attempt the actual connection with a timeout
    await instance.connect();
    await instance.ping();

    // Connection succeeded — wire up the instance
    redis = instance;

    redis.on('connect', () => {
      logger.info('✅ Redis connected successfully', {
        host: redis!.options.host,
        port: redis!.options.port,
      });
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed — cache disabled until reconnect');
    });

    redis.on('error', (error: Error) => {
      logger.error('Redis error', { error: error.message });
    });

    logger.info('✅ Redis connected successfully');
  } catch {
    logger.warn('⚠️  Redis connection failed — running without Redis (cache disabled)');
    // Clean up the failed instance
    redis = null;
  }
}

export { redis };
