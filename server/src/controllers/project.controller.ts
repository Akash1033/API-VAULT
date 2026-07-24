// Path: src/controllers/project.controller.ts
// Purpose: HTTP handlers for project CRUD — delegates to project.service
// Dependencies: catchAsync, ApiResponse, project.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  listProjects,
  getProjectBySlug,
  createProject as createProjectService,
  updateProject as updateProjectService,
  deleteProject as deleteProjectService,
} from '../services/project.service.js';
import type { CreateProjectInput, UpdateProjectInput } from '../validators/project.validators.js';

export const getAllProjects = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.pagination) {
    throw AppError.internal('Pagination middleware not applied');
  }

  const tags = req.query['tags']
    ? (req.query['tags'] as string).split(',').map((t) => t.trim())
    : undefined;

  const isPublishedParam = req.query['isPublished'] as string | undefined;
  const isPublished = isPublishedParam === 'all' ? 'all' : isPublishedParam === 'false' ? false : isPublishedParam === 'true' ? true : undefined;
  const featured = req.query['featured'] === 'true' ? true : req.query['featured'] === 'false' ? false : undefined;

  const { projects, meta } = await listProjects(req.pagination, {
    search: req.query['search'] as string | undefined,
    isPublished,
    tags,
    featured,
  });

  ApiResponse.paginated(res, projects, meta, 'Projects retrieved');
});

export const getProjectById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await getProjectBySlug(req.params.id as string);
  ApiResponse.ok(res, project, 'Project retrieved');
});

export const createProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as CreateProjectInput;
  const project = await createProjectService(data);
  ApiResponse.created(res, project, 'Project created');
});

export const updateProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as UpdateProjectInput;
  const project = await updateProjectService(req.params.id as string, data);
  ApiResponse.ok(res, project, 'Project updated');
});

export const deleteProject = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await deleteProjectService(req.params.id as string);
  ApiResponse.ok(res, null, 'Project deleted');
});
