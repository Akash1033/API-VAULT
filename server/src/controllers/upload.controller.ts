// Path: src/controllers/upload.controller.ts
// Purpose: Upload controller
// Dependencies: express

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../services/upload.service.js';

export const uploadProjectImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file || !req.file.buffer) {
    throw AppError.badRequest('No image file provided');
  }

  const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

  ApiResponse.ok(
    res,
    {
      url: result.secure_url,
      publicId: result.public_id
    },
    'Image uploaded successfully'
  );
});
