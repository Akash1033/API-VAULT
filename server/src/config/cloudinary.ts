// Path: src/config/cloudinary.ts
// Purpose: Cloudinary configuration
// Dependencies: cloudinary, env

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

export { cloudinary };
