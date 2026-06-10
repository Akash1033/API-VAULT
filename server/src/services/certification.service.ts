// Path: src/services/certification.service.ts
// Purpose: Business logic for certification CRUD operations
// Dependencies: Certification model, slug.utils, AppError, common.types

import { Certification, type ICertificationDocument } from '../models/certification.model.js';
import { AppError } from '../utils/AppError.js';
import { generateUniqueSlug } from '../utils/slug.utils.js';
import type { IPaginationOptions, IMeta } from '../types/common.types.js';
import type { CreateCertificationInput, UpdateCertificationInput } from '../validators/certification.validators.js';

interface ListFilters {
  readonly search?: string;
  readonly isPublished?: boolean;
  readonly tags?: ReadonlyArray<string>;
}

export async function listCertifications(
  pagination: IPaginationOptions,
  filters: ListFilters
): Promise<{ certifications: ReadonlyArray<ICertificationDocument>; meta: IMeta }> {
  const query: Record<string, unknown> = {};

  if (filters.isPublished !== undefined) query['isPublished'] = filters.isPublished;
  else query['isPublished'] = true;

  if (filters.tags && filters.tags.length > 0) query['tags'] = { $in: filters.tags };

  if (filters.search) {
    query['$text'] = { $search: filters.search };
  }

  const { page, limit, sort, order } = pagination;
  const skip = (page - 1) * limit;
  const sortDirection = order === 'asc' ? 1 : -1;

  const [certifications, total] = await Promise.all([
    Certification.find(query)
      .sort({ [sort]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean() as unknown as Promise<ICertificationDocument[]>,
    Certification.countDocuments(query),
  ]);

  return { certifications, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getCertificationBySlug(slug: string): Promise<ICertificationDocument> {
  const certification = await Certification.findOne({ slug }).lean() as unknown as ICertificationDocument | null;
  if (!certification) throw AppError.notFound('Certification');
  return certification;
}

export async function createCertification(data: CreateCertificationInput): Promise<ICertificationDocument> {
  const slug = await generateUniqueSlug(data.title, Certification);
  return await Certification.create({ ...data, slug });
}

export async function updateCertification(id: string, data: UpdateCertificationInput): Promise<ICertificationDocument> {
  const updateData: Record<string, unknown> = { ...data };
  
  if (data.title) {
    updateData['slug'] = await generateUniqueSlug(data.title, Certification, id);
  }

  const certification = await Certification.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean() as unknown as ICertificationDocument | null;

  if (!certification) throw AppError.notFound('Certification');
  return certification;
}

export async function deleteCertification(id: string): Promise<void> {
  const certification = await Certification.findByIdAndDelete(id);
  if (!certification) throw AppError.notFound('Certification');
}
