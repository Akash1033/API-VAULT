// Path: src/controllers/dashboard.controller.ts
import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getOverviewStats = catchAsync(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getOverviewStats();
  
  ApiResponse.ok(res, stats, 'Dashboard overview retrieved');
});
