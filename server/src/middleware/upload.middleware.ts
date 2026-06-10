// Path: src/middleware/upload.middleware.ts
// Purpose: Multer middleware for Cloudinary image upload
// Dependencies: multer, multer-storage-cloudinary

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: 'portfolio/projects',
    format: ['jpg','jpeg','png','webp'].includes(
      file.mimetype.split('/')[1]
    ) ? file.mimetype.split('/')[1] : 'webp',
    transformation: [
      { width: 1200, height: 675, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
    ],
    public_id: `project_${Date.now()}`
  })
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
