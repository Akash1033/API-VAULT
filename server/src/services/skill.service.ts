// Path: src/services/skill.service.ts
// Purpose: Business logic for skill CRUD operations
// Dependencies: Skill model, slug.utils, AppError, common.types

import { Skill, type ISkillDocument } from '../models/skill.model.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import type { IPaginationOptions, IMeta } from '../types/common.types.js';
import type { CreateSkillInput, UpdateSkillInput } from '../validators/skill.validators.js';

interface ListFilters {
  readonly search?: string;
  readonly isPublished?: boolean;
  readonly category?: string;
}

interface ListResult {
  readonly skills: ReadonlyArray<ISkillDocument>;
  readonly meta: IMeta;
}

export async function listSkills(
  pagination: IPaginationOptions,
  filters: ListFilters
): Promise<ListResult> {
  const query: Record<string, unknown> = {};

  if (filters.isPublished !== undefined) {
    query['isPublished'] = filters.isPublished;
  } else {
    query['isPublished'] = true;
  }

  if (filters.category) {
    query['category'] = filters.category;
  }

  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }

  const { page, limit, sort, order } = pagination;
  const skip = (page - 1) * limit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [skills, total] = await Promise.all([
    Skill.find(query)
      .sort({ [sort]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<ISkillDocument[]>,
    Skill.countDocuments(query),
  ]);

  return {
    skills,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSkillBySlug(slug: string): Promise<ISkillDocument> {
  const skill = await Skill.findOne({ slug }).lean() as unknown as ISkillDocument | null;

  if (!skill) {
    throw AppError.notFound('Skill');
  }

  return skill;
}

export async function createSkill(data: CreateSkillInput): Promise<ISkillDocument> {
  const slug = await generateUniqueSlug(data.name, Skill);
  const skill = await Skill.create({ ...data, slug });
  return skill;
}

export async function updateSkill(
  id: string,
  data: UpdateSkillInput
): Promise<ISkillDocument> {
  const updateData: Record<string, unknown> = { ...data };

  if (data.name) {
    updateData['slug'] = await generateUniqueSlug(data.name, Skill, id);
  }

  const skill = await Skill.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean() as unknown as ISkillDocument | null;

  if (!skill) {
    throw AppError.notFound('Skill');
  }

  return skill;
}

export async function deleteSkill(id: string): Promise<void> {
  const skill = await Skill.findByIdAndDelete(id);

  if (!skill) {
    throw AppError.notFound('Skill');
  }
}
