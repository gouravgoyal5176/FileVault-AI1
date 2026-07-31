import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: Role;
}

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_jwt_access_secret_development_only';
const ACCESS_TOKEN_EXPIRY = '15m';

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
    if (decoded && decoded.userId && decoded.role) {
      return { userId: decoded.userId, role: decoded.role };
    }
    return null;
  } catch (err) {
    return null;
  }
}
