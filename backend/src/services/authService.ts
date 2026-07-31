import { Response } from 'express';
import { prisma } from '../config/db';
import { hashPassword, verifyPassword, hashToken, generateRandomToken } from '../utils/crypto';
import { generateAccessToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validators/authValidation';
import { RiskLevel } from '@prisma/client';
import { checkUnusualAccess } from './threatService';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export function setRefreshTokenCookie(res: Response, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

export async function registerUser(input: RegisterInput, ipAddress: string, userAgent: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw { statusCode: 400, message: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  // Log registration activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      actionType: 'USER_REGISTERED',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    },
  });

  return user;
}

export async function loginUser(input: LoginInput, res: Response, ipAddress: string, userAgent: string) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Check lockout on existing user
  if (user && user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
    throw {
      statusCode: 403,
      message: `Account is temporarily locked due to consecutive failed login attempts. Try again in ${remainingMins} minute(s).`,
      lockoutUntil: user.lockoutUntil,
    };
  }

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    if (user) {
      const newFailedCount = user.failedLoginAttempts + 1;
      let lockoutUntil: Date | undefined = undefined;

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedCount,
          lockoutUntil,
        },
      });

      // Audit log failed login
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          actionType: 'LOGIN_FAILED',
          ipAddress,
          userAgent,
          metadata: { attemptCount: newFailedCount, lockedOut: !!lockoutUntil },
        },
      });

      // Generate Security Alert if account locked
      if (lockoutUntil) {
        await prisma.securityAlert.create({
          data: {
            userId: user.id,
            alertType: 'BRUTE_FORCE_LOCKOUT',
            riskLevel: RiskLevel.HIGH,
            description: `Account temporarily locked after ${MAX_FAILED_ATTEMPTS} consecutive failed login attempts from IP ${ipAddress}.`,
          },
        });
      }
    } else {
      // Anonymous failed login log
      await prisma.activityLog.create({
        data: {
          userId: null,
          actionType: 'LOGIN_FAILED_ANONYMOUS',
          ipAddress,
          userAgent,
          metadata: { attemptedEmail: email },
        },
      });
    }

    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  // Check unusual access (new IP address or device string)
  try {
    await checkUnusualAccess(user.id, ipAddress, userAgent);
  } catch (err: any) {
    console.warn('Unusual access detection check warning:', err.message);
  }

  // Successful Login — reset lockout & failed counters
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginIp: ipAddress,
      lastLoginUserAgent: userAgent,
      lastLoginAt: new Date(),
    },
  });

  // Log successful login
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      actionType: 'LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      metadata: { role: user.role },
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const rawRefreshToken = generateRandomToken(32);
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Store hashed refresh token in DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Set httpOnly cookie
  setRefreshTokenCookie(res, rawRefreshToken);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(rawRefreshToken: string | undefined, res: Response, ipAddress: string, userAgent: string) {
  if (!rawRefreshToken) {
    clearRefreshTokenCookie(res);
    throw { statusCode: 401, message: 'Refresh token missing.' };
  }

  const tokenHash = hashToken(rawRefreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    clearRefreshTokenCookie(res);
    throw { statusCode: 401, message: 'Invalid refresh token.' };
  }

  if (storedToken.revoked) {
    // Possible token reuse attack detected! Revoke all tokens for user & log alert
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revoked: true },
    });

    await prisma.securityAlert.create({
      data: {
        userId: storedToken.userId,
        alertType: 'REFRESH_TOKEN_REUSE',
        riskLevel: RiskLevel.CRITICAL,
        description: `Potential refresh token reuse detected from IP ${ipAddress}. All user sessions revoked.`,
      },
    });

    clearRefreshTokenCookie(res);
    throw { statusCode: 401, message: 'Security alert: Invalid session token. Please log in again.' };
  }

  if (storedToken.expiresAt < new Date()) {
    clearRefreshTokenCookie(res);
    throw { statusCode: 401, message: 'Refresh token expired. Please log in again.' };
  }

  // Rotate Refresh Token: revoke old one, generate new one
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  const newRawRefreshToken = generateRandomToken(32);
  const newTokenHash = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.userId,
      tokenHash: newTokenHash,
      expiresAt,
    },
  });

  setRefreshTokenCookie(res, newRawRefreshToken);

  const accessToken = generateAccessToken({
    userId: storedToken.user.id,
    role: storedToken.user.role,
  });

  return {
    accessToken,
    user: {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    },
  };
}

export async function logoutUser(rawRefreshToken: string | undefined, res: Response, userId?: string) {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  if (userId) {
    await prisma.activityLog.create({
      data: {
        userId,
        actionType: 'LOGOUT',
        ipAddress: '0.0.0.0',
        userAgent: 'Client',
      },
    });
  }

  clearRefreshTokenCookie(res);
  return { message: 'Logged out successfully.' };
}

export async function logoutAllDevices(userId: string, res: Response) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'LOGOUT_ALL_DEVICES',
      ipAddress: '0.0.0.0',
      userAgent: 'Client',
    },
  });

  clearRefreshTokenCookie(res);
  return { message: 'Logged out from all devices successfully.' };
}
