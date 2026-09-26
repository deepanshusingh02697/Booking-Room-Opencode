import { Request, Response } from 'express';
import { UserRole } from '../modules/auth/entities/employee';
import { SESSION_COOKIE, verifyToken } from '../modules/auth/utils/jwt';
import { parseCookieHeader, readCookie } from './cookie-header';

export interface AuthUser {
  id: number;
  role: UserRole;
}

export interface AppContext {
  req: Request;
  res: Response;
  user: AuthUser | null;
}

export const userFromCookies = (
  cookies: Record<string, unknown> | undefined,
): AuthUser | null => {
  const token = readCookie(cookies, SESSION_COOKIE);
  const payload = token ? verifyToken(token) : null;
  return payload ? { id: payload.id, role: payload.role } : null;
};

/**
 * Same session resolution as the GraphQL path, but from a raw `Cookie:` header —
 * used by the Socket.io handshake, which never goes through Express middleware.
 */
export const userFromCookieHeader = (
  header: string | undefined,
): AuthUser | null => userFromCookies(parseCookieHeader(header));

export const buildContext = ({ req, res }: { req: Request; res: Response }): AppContext => ({
  req,
  res,
  user: userFromCookies(req.cookies),
});
