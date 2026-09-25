import { Request, Response } from 'express';
import { UserRole } from '../modules/auth/entities/employee';
import { verifyToken } from '../modules/auth/utils/jwt';

export interface AuthUser {
  id: number;
  role: UserRole;
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
  const payload = token ? verifyToken(token) : null;
  return {
    req,
    res,
    user: payload ? { id: payload.id, role: payload.role } : null,
  };
};
