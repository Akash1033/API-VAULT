// Path: src/config/redis.ts
// Purpose: Redis connection setup using ioredis
// Dependencies: ioredis, env config, logger

import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully', { host: redis.options.host, port: redis.options.port });
});

redis.on('error', (error: Error) => {
  logger.error('❌ Redis connection error', { error: error.message });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});
