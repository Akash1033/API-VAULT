// Path: src/services/contact.service.ts
import { Contact, type IContact } from '../models/contact.model.js';
import type { CreateContactInput } from '../validators/contact.validator.js';
import { AppError } from '../utils/AppError.js';

export const contactService = {
  async create(
    data: CreateContactInput,
    meta: { ipAddress?: string; userAgent?: string }
  ): Promise<IContact> {
    const contact = await Contact.create({
      name: data.name,
      email: data.email,
      message: data.message,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      isRead: false
    });
    return contact;
  },

  async getAll(filters: {
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ messages: IContact[]; total: number; unread: number }> {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, filters.limit ?? 20);
    const skip = (page - 1) * limit;

    const query: { isRead?: boolean } = {};
    if (filters.read === true) query.isRead = true;
    if (filters.read === false) query.isRead = false;

    const [messages, total, unread] = await Promise.all([
      Contact.find(query)
        .sort({ isRead: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as Promise<IContact[]>,
      Contact.countDocuments(query),
      Contact.countDocuments({ isRead: false })
    ]);

    return { messages, total, unread };
  },

  async getById(id: string): Promise<IContact> {
    const contact = await Contact.findById(id).lean() as unknown as IContact | null;
    if (!contact) throw AppError.notFound('Message');
    return contact;
  },

  async markAsRead(id: string): Promise<IContact> {
    const contact = await Contact.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true, runValidators: false }
    ).lean() as unknown as IContact | null;
    if (!contact) throw AppError.notFound('Message');
    return contact;
  },

  async markAsUnread(id: string): Promise<IContact> {
    const contact = await Contact.findByIdAndUpdate(
      id,
      { isRead: false, readAt: null },
      { new: true, runValidators: false }
    ).lean() as unknown as IContact | null;
    if (!contact) throw AppError.notFound('Message');
    return contact;
  },

  async deleteById(id: string): Promise<void> {
    const result = await Contact.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw AppError.notFound('Message');
    }
  },

  async getUnreadCount(): Promise<number> {
    return Contact.countDocuments({ isRead: false });
  }
};
