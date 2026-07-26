// Path: src/controllers/settings.controller.ts
// Purpose: HTTP handlers for maintenance settings — delegates to settings.service
// Dependencies: catchAsync, ApiResponse, settings.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  getMaintenanceStatus as getStatus,
  updateMaintenanceSettings,
} from '../services/settings.service.js';
import type { UpdateMaintenanceInput } from '../validators/settings.validators.js';

/**
 * GET /api/v1/settings/maintenance
 * Public — returns current maintenance mode and message.
 */
export const getMaintenanceStatus = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const status = await getStatus();
    ApiResponse.ok(res, status, 'Maintenance status retrieved');
  }
);

/**
 * PATCH /api/v1/settings/maintenance
 * Admin-only — toggles maintenance mode and/or updates the message.
 */
export const updateMaintenanceStatus = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body as UpdateMaintenanceInput;
    const settings = await updateMaintenanceSettings(data);

    ApiResponse.ok(
      res,
      {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
      },
      'Maintenance settings updated'
    );
  }
);
