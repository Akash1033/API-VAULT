// Path: src/controllers/health.controller.ts
// Purpose: Health check controller — delegates to service, returns response via ApiResponse
// Dependencies: catchAsync, ApiResponse, health.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { getHealthStatus } from '../services/health.service.js';

export const checkHealth = catchAsync(async (_req: Request, res: Response): Promise<void> => {
  const healthData = await getHealthStatus();
  ApiResponse.ok(res, healthData, 'Server is running');
});
