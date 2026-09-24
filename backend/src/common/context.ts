import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const UserRole = {
  EMPLOYEE: 'EMPLOYEE',
  ADMIN: 'ADMIN',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  id: number;
  role: UserRoleType;
}

export interface AppContext {
  req: Request;
  res: Response;
  user: AuthUser | null;
}

const cookieToToken = (req: Request): string | null => {
  const cookie = req.cookies?.token;
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : null;
};

export const buildContext = ({ req, res }: { req: Request; res: Response }): AppContext => {
  const token = cookieToToken(req);

  let user: AuthUser | null = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: number; role: UserRoleType };
      if (typeof decoded.id === 'number' && decoded.role) {
        user = { id: decoded.id, role: decoded.role };
      }
    } catch {
      user = null;
    }
  }

  return { req, res, user };
};