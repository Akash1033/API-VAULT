// Path: src/config/db.ts
// Purpose: MongoDB connection with retry logic, connection pooling, and graceful shutdown
// Dependencies: mongoose, env config, logger

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

async function connectWithRetry(retryCount: number = 0): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
    });

    logger.info('✅ MongoDB connected successfully', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      poolSize: env.MONGODB_MAX_POOL_SIZE,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';

    if (retryCount >= MAX_RETRIES) {
      logger.error(`❌ MongoDB connection failed after ${MAX_RETRIES} retries`, {
        error: errorMessage,
      });
      process.exit(1);
    }

    const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
    logger.warn(
      `⚠️ MongoDB connection attempt ${retryCount + 1}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`,
      { error: errorMessage }
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return connectWithRetry(retryCount + 1);
  }
}

function registerConnectionEvents(): void {
  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected');
  });

  mongoose.connection.on('error', (error: Error) => {
    logger.error('❌ MongoDB connection error', { error: error.message });
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('✅ MongoDB reconnected');
  });
}

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received. Closing MongoDB connection...`);
  await mongoose.connection.close();
  logger.info('MongoDB connection closed through app termination');
  process.exit(0);
}

export async function connectDB(): Promise<void> {
  registerConnectionEvents();
  await connectWithRetry();
}

export function registerShutdownHooks(): void {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}
