// Path: src/services/upload.service.ts
// Purpose: Encapsulates image upload logic using Cloudinary v2 SDK natively
// Dependencies: cloudinary, AppError

import { cloudinary } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';
import type { UploadApiResponse } from 'cloudinary';

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  mimetype: string
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const format = ['jpg', 'jpeg', 'png', 'webp'].includes(mimetype.split('/')[1] || '')
      ? mimetype.split('/')[1]
      : 'webp';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'portfolio/projects',
        format,
        transformation: [
          { width: 1200, height: 675, crop: 'fill', quality: 'auto', fetch_format: 'auto' },
        ],
        public_id: `project_${Date.now()}`,
      },
      (error, result) => {
        if (error || !result) {
          return reject(AppError.internal('Failed to upload image to Cloudinary'));
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
