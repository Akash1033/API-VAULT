// Path: src/controllers/contact.controller.ts
import type { Request, Response } from 'express';
import { contactService } from '../services/contact.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import type { CreateContactInput } from '../validators/contact.validator.js';

export const createContact = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as CreateContactInput;

  const ipAddress = (
    req.headers['x-forwarded-for'] as string ||
    req.socket.remoteAddress ||
    'unknown'
  ).split(',')[0].trim();

  const userAgent = req.headers['user-agent'] ?? 'unknown';

  const contact = await contactService.create(data, { ipAddress, userAgent });

  ApiResponse.created(
    res,
    {
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      createdAt: contact.createdAt
    },
    'Message received. Will respond within 24h.'
  );
});

export const getAllMessages = catchAsync(async (req: Request, res: Response) => {
  const page  = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const readParam = req.query['read'] as string | undefined;

  let read: boolean | undefined;
  if (readParam === 'true') read = true;
  if (readParam === 'false') read = false;

  const { messages, total, unread } = await contactService.getAll({ read, page, limit });

  ApiResponse.paginated(
    res,
    messages,
    { total, page, limit, totalPages: Math.ceil(total / limit), unread },
    'Messages retrieved'
  );
});

export const getMessageById = catchAsync(async (req: Request, res: Response) => {
  const contact = await contactService.getById(req.params.id as string);
  ApiResponse.ok(res, { message: contact }, 'Message retrieved');
});

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const contact = await contactService.markAsRead(req.params.id as string);
  ApiResponse.ok(res, { message: contact }, 'Marked as read');
});

export const markAsUnread = catchAsync(async (req: Request, res: Response) => {
  const contact = await contactService.markAsUnread(req.params.id as string);
  ApiResponse.ok(res, { message: contact }, 'Marked as unread');
});

export const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  await contactService.deleteById(req.params.id as string);
  ApiResponse.ok(res, null, 'Message deleted');
});
