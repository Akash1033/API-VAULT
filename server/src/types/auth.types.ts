// Path: src/types/auth.types.ts
// Purpose: TypeScript interfaces and enums for the JWT authentication system
// Dependencies: mongoose

import type { Types, Document } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface IUser {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IRefreshToken {
  readonly userId: Types.ObjectId;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly userAgent: string;
  readonly ipAddress: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IRefreshTokenDocument extends IRefreshToken, Document {
  _id: Types.ObjectId;
}

export interface ITokenPayload {
  readonly userId: string;
  readonly role: UserRole;
}

export interface IAuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface IAuthResponse {
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly role: UserRole;
  };
  readonly accessToken: string;
}

export interface IRequestUser {
  readonly userId: string;
  readonly role: UserRole;
}
