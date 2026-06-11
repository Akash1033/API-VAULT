// Path: src/middleware/cache.middleware.ts
// Purpose: Redis caching middleware for GET requests and cache invalidation
// Dependencies: redis, express, logger

import type { Request, Response, NextFunction } from 'express';
import { redis, isRedisAvailable } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Cache GET requests for a specific duration.
 * Uses method + url as the cache key.
 * Skips caching entirely when Redis is unavailable.
 */
export function cacheRoute(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET' || !isRedisAvailable()) {
      next();
      return;
    }

    const baseUrl = req.originalUrl.split('?')[0];
    const queryParams = req.query;
    const sortedQuery = Object.keys(queryParams)
      .sort()
      .map((k) => `${k}=${String(queryParams[k])}`)
      .join('&');
    
    const key = `cache:${req.method}:${baseUrl}${sortedQuery ? '?' + sortedQuery : ''}`;

    try {
      const cachedData = await redis!.get(key);

      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        res.json(JSON.parse(cachedData));
        return;
      }

      res.setHeader('X-Cache', 'MISS');

      // Intercept res.json to capture response body
      const originalJson = res.json;
      res.json = function (body: unknown) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && isRedisAvailable()) {
          redis!.setex(key, ttlSeconds, JSON.stringify(body)).catch((err: unknown) => {
            logger.error('Redis cache write error', { error: (err as Error).message });
          });
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Redis cache read error', { error: (error as Error).message });
      next(); // Fail open if Redis is down
    }
  };
}

/**
 * Invalidate cache keys matching a pattern.
 * Useful for POST/PUT/DELETE operations.
 * Skips invalidation when Redis is unavailable.
 */
export function invalidateCache(pattern: string) {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Intercept res.json to invalidate only after successful request processing
    const originalJson = res.json;
    res.json = function (body: unknown): Response {
      // Restore original function to prevent double execution if called multiple times
      res.json = originalJson;

      if (res.statusCode >= 200 && res.statusCode < 300 && isRedisAvailable()) {
        (async () => {
          try {
            const keys = await redis!.keys(`cache:GET:${pattern}*`);
            if (keys.length > 0) {
              await redis!.del(keys);
            }
          } catch (err) {
            logger.error('Redis cache invalidation error', { error: (err as Error).message });
          } finally {
            originalJson.call(res, body);
          }
        })();
        return this;
      }

      return originalJson.call(res, body);
    };

    next();
  };
}
