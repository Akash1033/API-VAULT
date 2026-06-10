// Path: src/types/admin.ts
// Purpose: Shared TypeScript interfaces for the Admin Dashboard
// Dependencies: none

// ─── AUTH ─────────────────────────────────────────────────
export interface LoginPayload { email: string; password: string }
export interface User { _id: string; name: string; email: string; role: 'admin' | 'user' }

// ─── SHARED ───────────────────────────────────────────────
export interface PaginationMeta { total: number; page: number; limit: number; totalPages: number }
export interface ApiError { code: string; message: string; field?: string }
export interface ApiResponse<T> { success: boolean; data: T; meta?: PaginationMeta; errors?: ApiError[]; message?: string }
export interface PaginationParams { page?: number; limit?: number }

// ─── PROJECTS ─────────────────────────────────────────────
export interface Project {
  _id: string; title: string; slug: string; description: string; longDescription: string;
  technologies: string[]; tags: string[];
  githubUrl?: string; liveUrl?: string; thumbnailUrl?: string; images: string[];
  featured: boolean; displayOrder: number;
  isPublished: boolean; createdAt: string
}
export interface CreateProjectPayload {
  title: string; description: string; longDescription?: string; technologies?: string[]; tags?: string[];
  githubUrl?: string; liveUrl?: string; thumbnailUrl?: string;
  featured?: boolean; displayOrder?: number;
  isPublished?: boolean;
}
export type UpdateProjectPayload = Partial<CreateProjectPayload>;

// ─── SKILLS ───────────────────────────────────────────────
export interface Skill {
  _id: string; name: string
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'tools' | 'other'
  proficiency: number; iconUrl?: string
  isPublished: boolean; displayOrder: number
}
export interface CreateSkillPayload {
  name: string
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'tools' | 'other'
  proficiency: number
  iconUrl?: string
  isPublished?: boolean
  displayOrder?: number
}
export type UpdateSkillPayload = Partial<CreateSkillPayload>;

// ─── EXPERIENCE ───────────────────────────────────────────
export interface Experience {
  _id: string; company: string; role: string; location: string; type: string
  startDate: string; endDate?: string
  description: string; responsibilities: string[]
  technologies: string[]; tags: string[]; isPublished: boolean; displayOrder?: number
}
export interface CreateExperiencePayload {
  company: string; role: string; location?: string; type?: string
  startDate: string; endDate?: string
  description: string; responsibilities?: string[]
  technologies?: string[]; tags?: string[]; isPublished?: boolean; displayOrder?: number
}
export type UpdateExperiencePayload = Partial<CreateExperiencePayload>;

// ─── ARTICLES ─────────────────────────────────────────────
export interface Article {
  _id: string; title: string; slug: string; excerpt: string; content: string
  coverImageUrl?: string; tags: string[]; readTimeMinutes: number; isPublished: boolean
  publishedAt?: string; createdAt: string
}
export interface CreateArticlePayload {
  title: string; excerpt: string; content: string
  coverImageUrl?: string; tags?: string[]; readTimeMinutes?: number; isPublished?: boolean
}
export type UpdateArticlePayload = Partial<CreateArticlePayload>;

// ─── CERTIFICATIONS ───────────────────────────────────────
export interface Certification {
  _id: string; title: string; issuer: string
  issueDate: string; expiryDate?: string
  credentialId?: string; credentialUrl?: string; thumbnailUrl?: string
  tags: string[]; isPublished: boolean
}
export interface CreateCertificationPayload {
  title: string; issuer: string; issueDate: string
  expiryDate?: string; credentialId?: string
  credentialUrl?: string; thumbnailUrl?: string; tags?: string[]; isPublished?: boolean
}
export type UpdateCertificationPayload = Partial<CreateCertificationPayload>;

// ─── MESSAGES ─────────────────────────────────────────────
export interface Message {
  _id: string; name: string; email: string
  message: string; isRead: boolean; createdAt: string
}
