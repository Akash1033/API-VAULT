// Path: src/services/health.service.ts
// Purpose: Health check service returning system status information
// Dependencies: mongoose

import mongoose from 'mongoose';
import { redis } from '../config/redis.js';

interface HealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly uptime: number;
  readonly timestamp: string;
  readonly environment: string;
  readonly database: {
    readonly status: string;
    readonly responseTimeMs: number;
  };
  readonly redis: {
    readonly status: string;
    readonly responseTimeMs: number;
  };
  readonly memory: {
    readonly heapUsedMB: number;
    readonly heapTotalMB: number;
    readonly rssMB: number;
  };
}

const DB_STATE_MAP: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export async function getHealthStatus(): Promise<HealthStatus> {
  const dbState = mongoose.connection.readyState;
  let dbResponseTime = 0;

  if (dbState === 1) {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    dbResponseTime = Date.now() - start;
  }

  let redisResponseTime = 0;
  let redisStatus = 'disconnected';
  if (redis.status === 'ready') {
    const start = Date.now();
    await redis.ping();
    redisResponseTime = Date.now() - start;
    redisStatus = 'connected';
  }

  const memoryUsage = process.memoryUsage();

  return {
    status: dbState === 1 ? 'healthy' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] ?? 'development',
    database: {
      status: DB_STATE_MAP[dbState] ?? 'unknown',
      responseTimeMs: dbResponseTime,
    },
    redis: {
      status: redisStatus,
      responseTimeMs: redisResponseTime,
    },
    memory: {
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  };
}
