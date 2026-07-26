// Path: src/services/settings.service.ts
// Purpose: Business logic for maintenance settings — includes in-memory cache with 5s TTL
// Dependencies: Settings model, logger

import { Settings, type ISettingsDocument } from '../models/settings.model.js';
import { logger } from '../utils/logger.js';
import type { UpdateMaintenanceInput } from '../validators/settings.validators.js';

// ---------------------------------------------------------------------------
// In-memory cache to avoid hitting MongoDB on every request
// ---------------------------------------------------------------------------

interface MaintenanceCache {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  cachedAt: number;
}

const CACHE_TTL_MS = 5_000; // 5 seconds
let cache: MaintenanceCache | null = null;

/**
 * Invalidate the in-memory maintenance cache.
 * Called after a write operation so the next read fetches fresh data.
 */
export function invalidateMaintenanceCache(): void {
  cache = null;
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export interface MaintenanceStatus {
  readonly maintenanceMode: boolean;
  readonly maintenanceMessage: string;
}

/**
 * Get current maintenance status. Uses a 5-second in-memory cache to avoid
 * hitting MongoDB on every incoming request when used from middleware.
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  // Return from cache if still valid
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return {
      maintenanceMode: cache.maintenanceMode,
      maintenanceMessage: cache.maintenanceMessage,
    };
  }

  const settings = await Settings.getInstance();

  // Update cache
  cache = {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    cachedAt: Date.now(),
  };

  return {
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
  };
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Update maintenance settings (mode and/or message).
 * Immediately invalidates the in-memory cache so the middleware picks up
 * the change on the very next request.
 */
export async function updateMaintenanceSettings(
  data: UpdateMaintenanceInput
): Promise<ISettingsDocument> {
  const updateFields: Record<string, unknown> = {};

  if (data.maintenanceMode !== undefined) {
    updateFields['maintenanceMode'] = data.maintenanceMode;
  }
  if (data.maintenanceMessage !== undefined) {
    updateFields['maintenanceMessage'] = data.maintenanceMessage;
  }

  const settings = await Settings.findByIdAndUpdate(
    'app-settings',
    { $set: updateFields, $setOnInsert: { _id: 'app-settings' } },
    { upsert: true, new: true, runValidators: true }
  );

  // Immediately invalidate cache
  invalidateMaintenanceCache();

  logger.info('Maintenance settings updated', {
    maintenanceMode: settings!.maintenanceMode,
  });

  return settings!;
}
