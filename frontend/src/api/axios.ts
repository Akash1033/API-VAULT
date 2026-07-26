// Path: src/api/axios.ts
// Purpose: Axios instance with auth interception, silent token refresh, and maintenance mode detection
// Dependencies: axios, zustand (authStore, maintenanceStore)

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useMaintenanceStore } from '../store/maintenanceStore';

const API_HOST = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = `${API_HOST}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (config.headers) {
      config.headers.Authorization = token ? `Bearer ${token}` : undefined;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // ─── Maintenance mode detection ────────────────────────────────────
    // If the server returns 503 with maintenance: true in the body,
    // set the global maintenance store — but ONLY for non-admin page contexts.
    // Admin routes must never be affected by maintenance mode on the frontend.
    if (error.response?.status === 503) {
      const data = error.response.data as Record<string, unknown> | undefined;
      if (data && data['maintenance'] === true) {
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        if (!isAdminRoute) {
          useMaintenanceStore.getState().setMaintenance(
            true,
            (data['message'] as string) || 'Site is under maintenance.'
          );
        }
        return Promise.reject(error);
      }
    }

    // ─── Silent token refresh ──────────────────────────────────────────
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.get<{ data: { accessToken: string } }>(
          `${baseURL}/auth/refresh`,
          { withCredentials: true }
        );
        
        const newAccessToken = response.data.data.accessToken;
        useAuthStore.getState().setAuth(useAuthStore.getState().user, newAccessToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

