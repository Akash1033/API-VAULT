// Path: src/api/admin.ts
// Purpose: All admin API calls — uses the shared axios instance which already has baseURL = /api/v1
// Dependencies: axios instance, admin types
import { api as axiosInstance } from './axios'
import type {
  CreateProjectPayload, UpdateProjectPayload,
  CreateSkillPayload, UpdateSkillPayload,
  CreateExperiencePayload, UpdateExperiencePayload,
  CreateArticlePayload, UpdateArticlePayload,
  CreateCertificationPayload, UpdateCertificationPayload,
  LoginPayload, PaginationParams
} from '../types/admin'

// ─── AUTH ────────────────────────────────────────────────
export const adminLogin = (data: LoginPayload) =>
  axiosInstance.post('/auth/login', data).then(r => r.data)

export const adminLogout = () =>
  axiosInstance.post('/auth/logout').then(r => r.data)

export const getMe = () =>
  axiosInstance.get('/auth/me').then(r => r.data)

// ─── PROJECTS ────────────────────────────────────────────
export const getProjects = (params?: PaginationParams & { techStack?: string; isPublished?: boolean | 'all' }) =>
  axiosInstance.get('/projects', { params }).then(r => r.data)

export const getProjectById = (id: string) =>
  axiosInstance.get(`/projects/${id}`).then(r => r.data)

export const createProject = (data: CreateProjectPayload) =>
  axiosInstance.post('/projects', data).then(r => r.data)

export const updateProject = (id: string, data: UpdateProjectPayload) =>
  axiosInstance.put(`/projects/${id}`, data).then(r => r.data)

export const deleteProject = (id: string) =>
  axiosInstance.delete(`/projects/${id}`).then(r => r.data)

// ─── SKILLS ──────────────────────────────────────────────
export const getSkills = (params?: { category?: string; grouped?: boolean; isPublished?: boolean | 'all' }) =>
  axiosInstance.get('/skills', { params }).then(r => r.data)

export const getSkillById = (id: string) =>
  axiosInstance.get(`/skills/${id}`).then(r => r.data)

export const createSkill = (data: CreateSkillPayload) =>
  axiosInstance.post('/skills', data).then(r => r.data)

export const updateSkill = (id: string, data: UpdateSkillPayload) =>
  axiosInstance.put(`/skills/${id}`, data).then(r => r.data)

export const deleteSkill = (id: string) =>
  axiosInstance.delete(`/skills/${id}`).then(r => r.data)

// ─── EXPERIENCE ──────────────────────────────────────────
// CRITICAL: path is /experience (NOT /experiences with 's')
export const getExperience = (params?: { isPublished?: boolean | 'all' }) =>
  axiosInstance.get('/experience', { params }).then(r => r.data)

export const getExperienceById = (id: string) =>
  axiosInstance.get(`/experience/${id}`).then(r => r.data)

export const createExperience = (data: CreateExperiencePayload) =>
  axiosInstance.post('/experience', data).then(r => r.data)

export const updateExperience = (id: string, data: UpdateExperiencePayload) =>
  axiosInstance.put(`/experience/${id}`, data).then(r => r.data)

export const deleteExperience = (id: string) =>
  axiosInstance.delete(`/experience/${id}`).then(r => r.data)

// ─── ARTICLES ────────────────────────────────────────────
export const getArticles = (params?: { isPublished?: boolean | 'all'; tag?: string; page?: number; limit?: number; includeDrafts?: boolean }) =>
  axiosInstance.get('/articles', { params }).then(r => r.data)

export const getArticleById = (id: string) =>
  axiosInstance.get(`/articles/${id}`).then(r => r.data)

export const createArticle = (data: CreateArticlePayload) =>
  axiosInstance.post('/articles', data).then(r => r.data)

export const updateArticle = (id: string, data: UpdateArticlePayload) =>
  axiosInstance.put(`/articles/${id}`, data).then(r => r.data)

export const publishArticle = (id: string, isPublished: boolean) =>
  axiosInstance.patch(`/articles/${id}/publish`, { isPublished }).then(r => r.data)

export const deleteArticle = (id: string) =>
  axiosInstance.delete(`/articles/${id}`).then(r => r.data)

// ─── CERTIFICATIONS ──────────────────────────────────────
export const getCertifications = (params?: { isPublished?: boolean | 'all' }) =>
  axiosInstance.get('/certifications', { params }).then(r => r.data)

export const createCertification = (data: CreateCertificationPayload) =>
  axiosInstance.post('/certifications', data).then(r => r.data)

export const updateCertification = (id: string, data: UpdateCertificationPayload) =>
  axiosInstance.put(`/certifications/${id}`, data).then(r => r.data)

export const deleteCertification = (id: string) =>
  axiosInstance.delete(`/certifications/${id}`).then(r => r.data)

// ─── MESSAGES ────────────────────────────────────────────
export const sendContactMessage = (data: { name: string; email: string; message: string }) =>
  axiosInstance.post('/contact', data).then(r => r.data)

export const getMessages = (params?: { read?: boolean; page?: number; limit?: number }) =>
  axiosInstance.get('/contact', { params }).then(r => r.data)

export const markMessageAsRead = (id: string) =>
  axiosInstance.patch(`/contact/${id}/read`).then(r => r.data)

export const markMessageAsUnread = (id: string) =>
  axiosInstance.patch(`/contact/${id}/unread`).then(r => r.data)

export const deleteMessage = (id: string) =>
  axiosInstance.delete(`/contact/${id}`).then(r => r.data)

// ─── HEALTH ──────────────────────────────────────────────
// Health endpoint is mounted at /api/health, not under /api/v1
// so we need the full path relative to origin
export const getHealth = () =>
  axiosInstance.get('/health').then(r => r.data)

// ─── DASHBOARD STATS ─────────────────────────────────────
export interface RecentEntry {
  id: string;
  resource: 'projects' | 'skills' | 'articles' | 'messages';
  title: string;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  counts: {
    projects: number;
    skills: number;
    articles: number;
    messages: number;
  };
  recentEntries: RecentEntry[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  return axiosInstance.get('/dashboard/overview').then(r => r.data.data);
}

// ─── SETTINGS ────────────────────────────────────────────
export const getMaintenanceStatus = () =>
  axiosInstance.get('/settings/maintenance').then(r => r.data)

export const updateMaintenanceStatus = (data: { maintenanceMode?: boolean; maintenanceMessage?: string }) =>
  axiosInstance.patch('/settings/maintenance', data).then(r => r.data)

