// Path: src/controllers/experience.controller.ts
// Purpose: HTTP handlers for experience CRUD
// Dependencies: catchAsync, ApiResponse, experience.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  listExperiences,
  getExperienceBySlug,
  createExperience as createExpService,
  updateExperience as updateExpService,
  deleteExperience as deleteExpService,
} from '../services/experience.service.js';
import type { CreateExperienceInput, UpdateExperienceInput } from '../validators/experience.validators.js';

export const getAllExperience = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.pagination) throw AppError.internal('Pagination middleware not applied');

  const tags = req.query['tags'] ? (req.query['tags'] as string).split(',').map((t) => t.trim()) : undefined;
  const isPublishedParam = req.query['isPublished'] as string | undefined;
  const isPublished = isPublishedParam === 'false' ? false : isPublishedParam === 'true' ? true : undefined;

  const { experiences, meta } = await listExperiences(req.pagination, {
    search: req.query['search'] as string | undefined,
    isPublished,
    tags,
  });

  ApiResponse.paginated(res, experiences, meta, 'Experiences retrieved');
});

export const getExperienceById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const experience = await getExperienceBySlug(req.params.id as string);
  ApiResponse.ok(res, experience, 'Experience retrieved');
});

export const createExperience = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as CreateExperienceInput;
  const result = await createExpService(data);
  ApiResponse.created(res, result, 'Experience created');
});

export const updateExperience = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as UpdateExperienceInput;
  const result = await updateExpService(req.params.id as string, data);
  ApiResponse.ok(res, result, 'Experience updated');
});

export const deleteExperience = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await deleteExpService(req.params.id as string);
  ApiResponse.ok(res, null, 'Experience deleted');
});
