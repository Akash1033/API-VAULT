// Path: src/utils/ApiResponse.ts
// Purpose: Standardized success response builder for consistent API output shape
// Dependencies: common.types (IApiResponse, IMeta, HttpStatusCode)

import type { Response } from 'express';
import { type IApiResponse, type IMeta, HttpStatusCode } from '../types/common.types.js';

export class ApiResponse {
  static send<T>(
    res: Response,
    statusCode: HttpStatusCode,
    message: string,
    data: T,
    meta?: IMeta
  ): void {
    const response: IApiResponse<T> = {
      success: statusCode < 400,
      statusCode,
      message,
      data,
      meta,
      requestId: res.req?.requestId,
    };

    res.status(statusCode).json(response);
  }

  static ok<T>(res: Response, data: T, message: string = 'Success'): void {
    ApiResponse.send(res, HttpStatusCode.OK, message, data);
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully'): void {
    ApiResponse.send(res, HttpStatusCode.CREATED, message, data);
  }

  static noContent(res: Response): void {
    res.status(HttpStatusCode.NO_CONTENT).end();
  }

  static paginated<T>(
    res: Response,
    data: ReadonlyArray<T>,
    meta: IMeta,
    message: string = 'Success'
  ): void {
    ApiResponse.send(res, HttpStatusCode.OK, message, data, meta);
  }
}
