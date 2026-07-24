// Path: src/controllers/article.controller.ts
// Purpose: HTTP handlers for article CRUD
// Dependencies: catchAsync, ApiResponse, article.service

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import {
  listArticles,
  getArticleBySlug as getArticleBySlugService,
  createArticle as createArticleService,
  updateArticle as updateArticleService,
  deleteArticle as deleteArticleService,
} from '../services/article.service.js';
import type { CreateArticleInput, UpdateArticleInput } from '../validators/article.validators.js';

export const getAllArticles = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.pagination) throw AppError.internal('Pagination middleware not applied');

  const tags = req.query['tags'] ? (req.query['tags'] as string).split(',').map((t) => t.trim()) : undefined;
  const isPublishedParam = req.query['isPublished'] as string | undefined;
  const isPublished = isPublishedParam === 'all' ? 'all' : isPublishedParam === 'false' ? false : isPublishedParam === 'true' ? true : undefined;

  const { articles, meta } = await listArticles(req.pagination, {
    search: req.query['search'] as string | undefined,
    isPublished,
    tags,
  });

  ApiResponse.paginated(res, articles, meta, 'Articles retrieved');
});

export const getArticleById = catchAsync(async (req: Request, res: Response): Promise<void> => {
  // Assuming getArticleBySlug supports ID fallback or frontend routes by ID on this path
  const article = await getArticleBySlugService(req.params.id as string);
  ApiResponse.ok(res, article, 'Article retrieved');
});

export const getArticleBySlug = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const article = await getArticleBySlugService(req.params.slug as string);
  ApiResponse.ok(res, article, 'Article retrieved');
});

export const createArticle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as CreateArticleInput;
  const article = await createArticleService(data);
  ApiResponse.created(res, article, 'Article created');
});

export const updateArticle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const data = req.body as UpdateArticleInput;
  const article = await updateArticleService(req.params.id as string, data);
  ApiResponse.ok(res, article, 'Article updated');
});

export const publishArticle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const article = await updateArticleService(req.params.id as string, { isPublished: true });
  ApiResponse.ok(res, article, 'Article published');
});

export const deleteArticle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  await deleteArticleService(req.params.id as string);
  ApiResponse.ok(res, null, 'Article deleted');
});
