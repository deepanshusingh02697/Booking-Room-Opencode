import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { UserRole } from '../entities/employee';

export const SESSION_COOKIE = 'token';

export interface JwtPayload {
  id: number;
  role: UserRole;
}

const EXPIRES_PATTERN = /^(\d+)([smhd])$/;

const UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export const tokenMaxAgeMs = (): number => {
  const match = env.JWT_EXPIRES_IN.match(EXPIRES_PATTERN);
  if (!match) {
    return UNIT_MS.d;
  }
  return Number(match[1]) * UNIT_MS[match[2]];
};

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: Math.floor(tokenMaxAgeMs() / 1000),
  });

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }
    const { id, role } = decoded as Record<string, unknown>;
    const isValidRole =
      typeof role === 'string' &&
      (Object.values(UserRole) as string[]).includes(role);
    if (typeof id !== 'number' || !isValidRole) {
      return null;
    }
    return { id, role: role as UserRole };
  } catch {
    return null;
  }
};
