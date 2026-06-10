// Path: src/api/axios.ts
// Purpose: Axios instance with auth interception and silent token refresh
// Dependencies: axios, zustand (authStore)

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

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
