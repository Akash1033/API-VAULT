// Path: src/controllers/upload.controller.ts
// Purpose: Upload controller
// Dependencies: express

import type { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';

export const uploadProjectImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No image file provided');
  }

  const file = req.file as Express.Multer.File & { path: string; filename: string };

  ApiResponse.ok(
    res,
    {
      url: file.path,
      publicId: file.filename
    },
    'Image uploaded successfully'
  );
});
