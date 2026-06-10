// Path: src/controllers/skill.controller.ts
// Purpose: HTTP handlers for skill CRUD — delegates to skill.service
// Dependencies: catchAsync, ApiResponse, skill.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  listSkills,
  getSkillBySlug,
  createSkill as createSkillService,
  updateSkill as updateSkillService,
  deleteSkill as deleteSkillService,
} from '../services/skill.service.js';
import type { CreateSkillInput, UpdateSkillInput } from '../validators/skill.validators.js';

export const getAllSkills = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.pagination) {
    throw AppError.internal('Pagination middleware not applied');
  }

  const isPublishedParam = req.query['isPublished'] as string | undefined;
  const isPublished = isPublishedParam === 'false' ? false : isPublishedParam === 'true' ? true : undefined;

  const { skills, meta } = await listSkills(req.pagination, {
    search: req.query['search'] as string | undefined,
    isPublished,
    category: req.query['category'] as string | undefined,
  });

  ApiResponse.paginated(res, skills, meta, 'Skills retrieved');
});

export const getSkillById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const skill = await getSkillBySlug(req.params.id as string);
  ApiResponse.ok(res, skill, 'Skill retrieved');
});

export const createSkill = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as CreateSkillInput;
  const skill = await createSkillService(data);
  ApiResponse.created(res, skill, 'Skill created');
});

export const updateSkill = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as UpdateSkillInput;
  const skill = await updateSkillService(req.params.id as string, data);
  ApiResponse.ok(res, skill, 'Skill updated');
});

export const deleteSkill = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await deleteSkillService(req.params.id as string);
  ApiResponse.ok(res, null, 'Skill deleted');
});
