// Path: src/services/article.service.ts
// Purpose: Business logic for article CRUD operations
// Dependencies: Article model, slug.utils, AppError, common.types

import { Article, type IArticleDocument } from '../models/article.model.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import type { IPaginationOptions, IMeta } from '../types/common.types.js';
import type { CreateArticleInput, UpdateArticleInput } from '../validators/article.validators.js';

interface ListFilters {
  readonly search?: string;
  readonly isPublished?: boolean | 'all';
  readonly tags?: ReadonlyArray<string>;
}

export async function listArticles(
  pagination: IPaginationOptions,
  filters: ListFilters
): Promise<{ articles: ReadonlyArray<IArticleDocument>; meta: IMeta }> {
  const query: Record<string, unknown> = {};

  if (filters.isPublished === 'all') {
    // Return both published and drafts
  } else if (filters.isPublished !== undefined) {
    query['isPublished'] = filters.isPublished;
  } else {
    query['isPublished'] = true;
  }

  if (filters.tags && filters.tags.length > 0) query['tags'] = { $in: filters.tags };

  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }

  const { page, limit, sort, order } = pagination;
  const skip = (page - 1) * limit;
  // If sort is createdAt and we have publishedAt, prefer publishedAt for published articles
  const actualSort = sort === 'createdAt' && query['isPublished'] === true ? 'publishedAt' : sort;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [articles, total] = await Promise.all([
    Article.find(query)
      .sort({ [actualSort]: sortDirection })
      .skip(skip)
      .limit(limit)
      .select('-content')
      .lean() as unknown as Promise<IArticleDocument[]>,
    Article.countDocuments(query),
  ]);

  return { articles, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getArticleBySlug(slug: string): Promise<IArticleDocument> {
  const article = await Article.findOne({ slug }).lean() as unknown as IArticleDocument | null;
  if (!article) throw AppError.notFound('Article');
  return article;
}

export async function createArticle(data: CreateArticleInput): Promise<IArticleDocument> {
  const slug = await generateUniqueSlug(data.title, Article);
  
  const articleData: Record<string, unknown> = { ...data, slug };
  if (data.isPublished && !data.publishedAt) {
    articleData['publishedAt'] = new Date();
  }
  
  return await Article.create(articleData);
}

export async function updateArticle(id: string, data: UpdateArticleInput): Promise<IArticleDocument> {
  const updateData: Record<string, unknown> = { ...data };
  
  if (data.title) {
    updateData['slug'] = await generateUniqueSlug(data.title, Article, id);
  }

  // Handle auto-setting publishedAt when first published
  if (data.isPublished) {
    const existing = await Article.findById(id).lean();
    if (existing && !existing.isPublished && !existing.publishedAt && !data.publishedAt) {
      updateData['publishedAt'] = new Date();
    }
  }

  const article = await Article.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean() as unknown as IArticleDocument | null;

  if (!article) throw AppError.notFound('Article');
  return article;
}

export async function deleteArticle(id: string): Promise<void> {
  const article = await Article.findByIdAndDelete(id);
  if (!article) throw AppError.notFound('Article');
}
