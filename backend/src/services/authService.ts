import { Response } from 'express';
import { prisma } from '../config/db';
import { hashPassword, verifyPassword, hashToken, generateRandomToken } from '../utils/crypto';
import { generateAccessToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validators/authValidation';
import { AuthProvider, RiskLevel, Role, UserStatus } from '@prisma/client';
import { checkUnusualAccess } from './threatService';
import { OAuth2Client } from 'google-auth-library';
import { redisClient } from '../config/redis';
import { sendRegistrationOtpEmail, sendLoginOtpEmail } from './emailService';
import crypto from 'crypto';

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

export async function registerUser(
  input: RegisterInput,
  res: Response,
  ipAddress: string,
  userAgent: string
) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (existingUser) {
    throw { statusCode: 400, message: 'An account with this email already exists.' };
  }

  // If OTP is provided in registration payload, verify against Redis
  if (input.otp) {
    const otpKey = `otp:${email}`;
    const recordStr = await redisClient.get(otpKey);
    if (!recordStr) {
      throw { statusCode: 400, message: 'Verification code expired or not found. Please request a new code.' };
    }
    const record = JSON.parse(recordStr);
    const hashedInput = hashToken(input.otp.trim());

    if (hashedInput !== record.hash) {
      const newAttempts = (record.attempts || 0) + 1;
      if (newAttempts >= 3) {
        await redisClient.del(otpKey);
        throw { statusCode: 400, message: 'Maximum verification attempts exceeded. Verification code invalidated. Please request a new code.' };
      }
      const ttl = await redisClient.ttl(otpKey);
      await redisClient.set(otpKey, JSON.stringify({ hash: record.hash, attempts: newAttempts }), 'EX', ttl > 0 ? ttl : 300);
      throw { statusCode: 400, message: `Invalid verification code. Remaining attempts: ${3 - newAttempts}.` };
    }

    // Delete OTP keys on successful verification
    await redisClient.del(otpKey);
    await redisClient.del(`otp_cooldown:${email}`);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: true,
    },
    select: { id: true, email: true, role: true, emailVerified: true, authProvider: true, googleId: true, createdAt: true },
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

  // Issue JWT access token (15m expiration)
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  // Generate & store Refresh Token (7-day expiration)
  const rawRefreshToken = generateRandomToken(32);
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return {
    accessToken,
    user,
  };
}

export async function loginUser(input: LoginInput, res: Response, ipAddress: string, userAgent: string) {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Check account suspension
  if (user && user.status === 'SUSPENDED') {
    throw {
      statusCode: 403,
      message: 'Your account has been suspended by an administrator. Please contact support.',
    };
  }

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

  // Password verification succeeded! Generate Login MFA OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashToken(otp);

  // Store ONLY SHA-256 hash in Redis key login_otp:<email> with 5-minute (300s) TTL
  await redisClient.set(`login_otp:${email}`, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);
  // Set 60-second cooldown key
  await redisClient.set(`login_otp_cooldown:${email}`, '1', 'EX', 60);

  // Send Login OTP via Nodemailer SMTP
  const mailResult = await sendLoginOtpEmail({
    recipientEmail: email,
    otp,
  });

  if (!mailResult.success) {
    throw { statusCode: 500, message: `Failed to dispatch login verification email: ${mailResult.error}` };
  }

  // DO NOT issue final JWT/session yet; return requiresOtp state
  return {
    requiresOtp: true,
    email: user.email,
    message: 'Verification code sent to your email address.',
  };
}

export async function adminLoginUser(input: LoginInput, res: Response, ipAddress: string, userAgent: string) {
  const email = input.email.trim().toLowerCase();
  
  let user = await prisma.user.findUnique({
    where: { email },
  });

  const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@filevault.ai').trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD || 'AdminVault2026!';

  // Bootstrap/Promote admin if logging in as envAdminEmail
  if (email === envAdminEmail) {
    if (!user) {
      const passwordHash = await hashPassword(envAdminPassword);
      user = await prisma.user.create({
        data: {
          email: envAdminEmail,
          passwordHash,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          emailVerified: true,
        },
      });
    } else if (user.role !== Role.ADMIN) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.ADMIN, status: UserStatus.ACTIVE, emailVerified: true },
      });
    }
  }

  if (!user) {
    throw { statusCode: 401, message: 'Invalid admin email or password.' };
  }

  if (user.status === UserStatus.SUSPENDED) {
    throw { statusCode: 403, message: 'Administrator account is suspended.' };
  }

  if (user.role !== Role.ADMIN) {
    throw { statusCode: 403, message: 'Access denied. Account does not have administrative privileges.' };
  }

  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMins = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
    throw {
      statusCode: 403,
      message: `Account is temporarily locked. Try again in ${remainingMins} minute(s).`,
      lockoutUntil: user.lockoutUntil,
    };
  }

  let validPassword = await verifyPassword(input.password, user.passwordHash);

  // Fallback check if user was created before envAdminPassword changed
  if (!validPassword && email === envAdminEmail && input.password === envAdminPassword) {
    const newHash = await hashPassword(envAdminPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
    validPassword = true;
  }

  if (!validPassword) {
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

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: 'ADMIN_LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: { attemptCount: newFailedCount, lockedOut: !!lockoutUntil },
      },
    });

    throw { statusCode: 401, message: 'Invalid admin email or password.' };
  }

  // Reset counters
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      lastLoginUserAgent: userAgent,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      actionType: 'ADMIN_LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: Role.ADMIN,
  });

  const rawRefreshToken = generateRandomToken(32);
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
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

export async function authenticateGoogleUser(
  idToken: string,
  res: Response,
  ipAddress: string,
  userAgent: string
) {
  if (!idToken) {
    throw { statusCode: 400, message: 'Google ID token is required.' };
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClient = new OAuth2Client(googleClientId);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId || undefined,
    });
    payload = ticket.getPayload();
  } catch (err: any) {
    throw { statusCode: 401, message: `Invalid or expired Google ID token: ${err.message}` };
  }

  if (!payload) {
    throw { statusCode: 401, message: 'Invalid Google ID token payload.' };
  }

  const sub = payload.sub;
  const email = payload.email?.toLowerCase();
  const emailVerified = payload.email_verified;

  if (!email || emailVerified !== true) {
    throw { statusCode: 401, message: 'Google authentication failed: Email is missing or unverified by Google.' };
  }

  // 1. Check if user already exists by googleId
  let user = await prisma.user.findUnique({
    where: { googleId: sub },
  });

  if (!user) {
    // 2. Check if a LOCAL account with matching email exists (case-insensitive)
    const existingEmailUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existingEmailUser) {
      // Link Google sub to existing account since Google email_verified === true
      user = await prisma.user.update({
        where: { id: existingEmailUser.id },
        data: {
          googleId: sub,
          authProvider: existingEmailUser.authProvider === AuthProvider.LOCAL ? AuthProvider.HYBRID : existingEmailUser.authProvider,
          emailVerified: true,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          actionType: 'GOOGLE_ACCOUNT_LINKED',
          ipAddress,
          userAgent,
          metadata: { googleId: sub, email },
        },
      });
    } else {
      // 3. Create new user for Google login
      const dummyPasswordHash = await hashPassword(generateRandomToken(32));
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: dummyPasswordHash,
          googleId: sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          actionType: 'USER_REGISTERED_GOOGLE',
          ipAddress,
          userAgent,
          metadata: { email, googleId: sub },
        },
      });
    }
  }

  if (user.status === 'SUSPENDED') {
    throw {
      statusCode: 403,
      message: 'Your account has been suspended by an administrator. Please contact support.',
    };
  }

  // Update lockout and login telemetry
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

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      actionType: 'LOGIN_SUCCESS_GOOGLE',
      ipAddress,
      userAgent,
      metadata: { role: user.role, authProvider: user.authProvider },
    },
  });

  // Issue standard tokens using existing session infrastructure
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const rawRefreshToken = generateRandomToken(32);
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  setRefreshTokenCookie(res, rawRefreshToken);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      googleId: user.googleId,
      authProvider: user.authProvider,
      emailVerified: user.emailVerified,
    },
  };
}

export async function sendRegistrationOtp(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const cooldownKey = `otp_cooldown:${email}`;

  // Check 60-second resend cooldown
  const inCooldown = await redisClient.get(cooldownKey);
  if (inCooldown) {
    throw { statusCode: 429, message: 'Please wait 60 seconds before requesting another verification code.' };
  }

  // Generate 6-digit numeric OTP via cryptographically secure randomInt
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashToken(otp);

  // Store ONLY SHA-256 hash in Redis with 5-minute (300s) TTL
  await redisClient.set(`otp:${email}`, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);
  // Set 60-second cooldown key
  await redisClient.set(cooldownKey, '1', 'EX', 60);

  // Send OTP via Nodemailer SMTP transport
  const mailResult = await sendRegistrationOtpEmail({
    recipientEmail: email,
    otp,
  });

  if (!mailResult.success) {
    throw { statusCode: 500, message: `Failed to dispatch verification email: ${mailResult.error}` };
  }

  return {
    success: true,
    message: 'Verification code sent to your email address.',
  };
}

export async function verifyRegistrationOtp(emailInput: string, otpInput: string) {
  const email = emailInput.trim().toLowerCase();
  const otpKey = `otp:${email}`;
  const recordStr = await redisClient.get(otpKey);

  if (!recordStr) {
    throw { statusCode: 400, message: 'Verification code expired or not found. Please request a new code.' };
  }

  const record = JSON.parse(recordStr);
  const hashedInput = hashToken(otpInput.trim());

  if (hashedInput === record.hash) {
    // Delete OTP keys on successful verification
    await redisClient.del(otpKey);
    await redisClient.del(`otp_cooldown:${email}`);

    // If user record already exists in DB, update emailVerified status
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: true },
      });
    }

    return {
      verified: true,
      message: 'Email verified successfully.',
    };
  }

  // Increment failed attempt counter
  const newAttempts = (record.attempts || 0) + 1;

  if (newAttempts >= 3) {
    await redisClient.del(otpKey);
    throw { statusCode: 400, message: 'Maximum verification attempts exceeded. Verification code invalidated. Please request a new code.' };
  }

  const ttl = await redisClient.ttl(otpKey);
  await redisClient.set(otpKey, JSON.stringify({ hash: record.hash, attempts: newAttempts }), 'EX', ttl > 0 ? ttl : 300);

  throw {
    statusCode: 400,
    message: `Invalid verification code. Remaining attempts: ${3 - newAttempts}.`,
  };
}

export async function sendLoginOtp(emailInput: string) {
  const email = emailInput.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  const cooldownKey = `login_otp_cooldown:${email}`;
  const inCooldown = await redisClient.get(cooldownKey);
  if (inCooldown) {
    throw { statusCode: 429, message: 'Please wait 60 seconds before requesting another verification code.' };
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashToken(otp);

  await redisClient.set(`login_otp:${email}`, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);
  await redisClient.set(cooldownKey, '1', 'EX', 60);

  const mailResult = await sendLoginOtpEmail({ recipientEmail: email, otp });
  if (!mailResult.success) {
    throw { statusCode: 500, message: `Failed to dispatch login verification email: ${mailResult.error}` };
  }

  return { success: true, message: 'Verification code sent to your email address.' };
}

export async function verifyLoginOtp(
  emailInput: string,
  otpInput: string,
  res: Response,
  ipAddress: string,
  userAgent: string
) {
  const email = emailInput.trim().toLowerCase();
  const otpKey = `login_otp:${email}`;
  const recordStr = await redisClient.get(otpKey);

  if (!recordStr) {
    throw { statusCode: 400, message: 'Verification code expired or not found. Please request a new code.' };
  }

  const record = JSON.parse(recordStr);
  const hashedInput = hashToken(otpInput.trim());

  if (hashedInput === record.hash) {
    await redisClient.del(otpKey);
    await redisClient.del(`login_otp_cooldown:${email}`);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw { statusCode: 404, message: 'User account not found.' };
    }

    // Reset lockout counters & update login telemetry
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

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        actionType: 'LOGIN_SUCCESS_MFA',
        ipAddress,
        userAgent,
        metadata: { role: user.role, authProvider: user.authProvider },
      },
    });

    // Issue standard tokens using existing session infrastructure
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const rawRefreshToken = generateRandomToken(32);
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    setRefreshTokenCookie(res, rawRefreshToken);

    return {
      verified: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        googleId: user.googleId,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
      },
    };
  }

  const newAttempts = (record.attempts || 0) + 1;
  if (newAttempts >= 3) {
    await redisClient.del(otpKey);
    throw { statusCode: 400, message: 'Maximum verification attempts exceeded. Verification code invalidated. Please request a new code.' };
  }

  const ttl = await redisClient.ttl(otpKey);
  await redisClient.set(otpKey, JSON.stringify({ hash: record.hash, attempts: newAttempts }), 'EX', ttl > 0 ? ttl : 300);

  throw {
    statusCode: 400,
    message: `Invalid verification code. Remaining attempts: ${3 - newAttempts}.`,
  };
}
