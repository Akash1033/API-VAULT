// Path: src/services/project.service.ts
// Purpose: Business logic for project CRUD operations
// Dependencies: Project model, slug.utils, AppError, common.types

import { Project, type IProjectDocument } from '../models/project.model.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import type { IPaginationOptions, IMeta } from '../types/common.types.js';
import type { CreateProjectInput, UpdateProjectInput } from '../validators/project.validators.js';

interface ListFilters {
  readonly search?: string;
  readonly isPublished?: boolean;
  readonly tags?: ReadonlyArray<string>;
  readonly featured?: boolean;
}

interface ListResult {
  readonly projects: ReadonlyArray<IProjectDocument>;
  readonly meta: IMeta;
}

export async function listProjects(
  pagination: IPaginationOptions,
  filters: ListFilters
): Promise<ListResult> {
  const query: Record<string, unknown> = {};

  // Default to published-only for public consumers
  if (filters.isPublished !== undefined) {
    query['isPublished'] = filters.isPublished;
  } else {
    query['isPublished'] = true;
  }

  if (filters.tags && filters.tags.length > 0) {
    query['tags'] = { $in: filters.tags };
  }

  if (filters.featured !== undefined) {
    query['featured'] = filters.featured;
  }

  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }

  const { page, limit, sort, order } = pagination;
  const skip = (page - 1) * limit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort({ [sort]: sortDirection })
      .skip(skip)
      .limit(limit)
      .select('-longDescription -images')
      .lean() as unknown as Promise<IProjectDocument[]>,
    Project.countDocuments(query),
  ]);

  return {
    projects,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProjectBySlug(slug: string): Promise<IProjectDocument> {
  const project = await Project.findOne({ slug }).lean() as unknown as IProjectDocument | null;

  if (!project) {
    throw AppError.notFound('Project');
  }

  return project;
}

export async function createProject(data: CreateProjectInput): Promise<IProjectDocument> {
  const slug = await generateUniqueSlug(data.title, Project);

  const project = await Project.create({ ...data, slug });

  return project;
}

export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<IProjectDocument> {
  const updateData: Record<string, unknown> = { ...data };

  // Re-generate slug if title changes
  if (data.title) {
    updateData['slug'] = await generateUniqueSlug(data.title, Project, id);
  }

  const project = await Project.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean() as unknown as IProjectDocument | null;

  if (!project) {
    throw AppError.notFound('Project');
  }

  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const project = await Project.findByIdAndDelete(id);

  if (!project) {
    throw AppError.notFound('Project');
  }
}
