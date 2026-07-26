// Path: src/store/maintenanceStore.ts
// Purpose: Global maintenance mode state — set by axios interceptor, read by App.tsx
// Dependencies: zustand

import { create } from 'zustand';

interface MaintenanceState {
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  setMaintenance: (mode: boolean, message: string) => void;
  clearMaintenance: () => void;
}

export const useMaintenanceStore = create<MaintenanceState>()((set) => ({
  isMaintenanceMode: false,
  maintenanceMessage: '',
  setMaintenance: (isMaintenanceMode, maintenanceMessage) =>
    set({ isMaintenanceMode, maintenanceMessage }),
  clearMaintenance: () =>
    set({ isMaintenanceMode: false, maintenanceMessage: '' }),
}));
