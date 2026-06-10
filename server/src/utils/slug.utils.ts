// Path: src/utils/slug.utils.ts
// Purpose: Generate URL-safe slugs from text, with uniqueness check against Mongoose models
// Dependencies: mongoose

import type { Model, Document } from 'mongoose';

/**
 * Convert a string to a URL-safe slug.
 * "My Awesome Project!" → "my-awesome-project"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // remove non-word chars (except spaces and hyphens)
    .replace(/[\s_]+/g, '-')      // replace spaces and underscores with hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');     // trim leading/trailing hyphens
}

/**
 * Generate a slug that is unique within a given Mongoose model's collection.
 * If "my-project" already exists, returns "my-project-2", then "my-project-3", etc.
 *
 * @param text - The raw text to slugify (e.g., title)
 * @param model - The Mongoose model to check uniqueness against
 * @param excludeId - Optional document ID to exclude (for updates)
 */
export async function generateUniqueSlug<T extends Document>(
  text: string,
  model: Model<T>,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(text);
  let slug = baseSlug;
  let suffix = 1;

  
  while (true) {
    const query: Record<string, unknown> = { slug };
    if (excludeId) {
      query['_id'] = { $ne: excludeId };
    }

    const existing = await model.findOne(query).lean();

    if (!existing) {
      return slug;
    }

    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
}
