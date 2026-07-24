// Path: src/controllers/certification.controller.ts
// Purpose: HTTP handlers for certification CRUD
// Dependencies: catchAsync, ApiResponse, certification.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  listCertifications,
  createCertification as createCertService,
  updateCertification as updateCertService,
  deleteCertification as deleteCertService,
} from '../services/certification.service.js';
import type { CreateCertificationInput, UpdateCertificationInput } from '../validators/certification.validators.js';

export const getAllCertifications = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.pagination) throw AppError.internal('Pagination middleware not applied');

  const tags = req.query['tags'] ? (req.query['tags'] as string).split(',').map((t) => t.trim()) : undefined;
  const isPublishedParam = req.query['isPublished'] as string | undefined;
  const isPublished = isPublishedParam === 'all' ? 'all' : isPublishedParam === 'false' ? false : isPublishedParam === 'true' ? true : undefined;

  const { certifications, meta } = await listCertifications(req.pagination, {
    search: req.query['search'] as string | undefined,
    isPublished,
    tags,
  });

  ApiResponse.paginated(res, certifications, meta, 'Certifications retrieved');
});

export const createCertification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as CreateCertificationInput;
  const certification = await createCertService(data);
  ApiResponse.created(res, certification, 'Certification created');
});

export const updateCertification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as UpdateCertificationInput;
  const certification = await updateCertService(req.params.id as string, data);
  ApiResponse.ok(res, certification, 'Certification updated');
});

export const deleteCertification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await deleteCertService(req.params.id as string);
  ApiResponse.ok(res, null, 'Certification deleted');
});
