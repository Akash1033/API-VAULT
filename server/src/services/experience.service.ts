// Path: src/services/experience.service.ts
// Purpose: Business logic for experience CRUD operations
// Dependencies: Experience model, slug.utils, AppError, common.types

import { Experience, type IExperienceDocument } from '../models/experience.model.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import type { IPaginationOptions, IMeta } from '../types/common.types.js';
import type { CreateExperienceInput, UpdateExperienceInput } from '../validators/experience.validators.js';

interface ListFilters {
  readonly search?: string;
  readonly isPublished?: boolean | 'all';
  readonly tags?: ReadonlyArray<string>;
}

export async function listExperiences(
  pagination: IPaginationOptions,
  filters: ListFilters
): Promise<{ experiences: ReadonlyArray<IExperienceDocument>; meta: IMeta }> {
  const query: Record<string, unknown> = {};

  if (filters.isPublished === 'all') {
    // Return both published and drafts
  } else if (filters.isPublished !== undefined) {
    query['isPublished'] = filters.isPublished;
  } else {
    query['isPublished'] = true;
  }

  if (filters.tags && filters.tags.length > 0) {
    query['tags'] = { $in: filters.tags };
  }

  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }

  const { page, limit, sort, order } = pagination;
  const skip = (page - 1) * limit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [experiences, total] = await Promise.all([
    Experience.find(query)
      .sort({ [sort]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<IExperienceDocument[]>,
    Experience.countDocuments(query),
  ]);

  return {
    experiences,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExperienceBySlug(slug: string): Promise<IExperienceDocument> {
  const experience = await Experience.findOne({ slug }).lean() as unknown as IExperienceDocument | null;
  if (!experience) throw AppError.notFound('Experience');
  return experience;
}

export async function createExperience(data: CreateExperienceInput): Promise<IExperienceDocument> {
  const slugText = `${data.company}-${data.role}`;
  const slug = await generateUniqueSlug(slugText, Experience);
  const experience = await Experience.create({ ...data, slug });
  return experience;
}

export async function updateExperience(id: string, data: UpdateExperienceInput): Promise<IExperienceDocument> {
  const updateData: Record<string, unknown> = { ...data };
  
  if (data.company || data.role) {
    const existing = await Experience.findById(id).lean() as unknown as IExperienceDocument | null;
    if (existing) {
      const company = data.company || existing.company;
      const role = data.role || existing.role;
      updateData['slug'] = await generateUniqueSlug(`${company}-${role}`, Experience, id);
    }
  }

  const experience = await Experience.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean() as unknown as IExperienceDocument | null;

  if (!experience) throw AppError.notFound('Experience');
  return experience;
}

export async function deleteExperience(id: string): Promise<void> {
  const experience = await Experience.findByIdAndDelete(id);
  if (!experience) throw AppError.notFound('Experience');
}
