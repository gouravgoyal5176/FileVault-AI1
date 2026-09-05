import { prisma } from '../config/db';
import { Role, UserStatus, AuthProvider } from '@prisma/client';

export async function getAdminStats() {
  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    verifiedUsers,
    unverifiedUsers,
    googleUsers,
    localUsers,
    hybridUsers,
    totalFiles,
    totalShares,
    activeAlerts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
    prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { emailVerified: false } }),
    prisma.user.count({ where: { authProvider: AuthProvider.GOOGLE } }),
    prisma.user.count({ where: { authProvider: AuthProvider.LOCAL } }),
    prisma.user.count({ where: { authProvider: AuthProvider.HYBRID } }),
    prisma.file.count(),
    prisma.fileShare.count(),
    prisma.securityAlert.count({ where: { resolved: false } }),
  ]);

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    verifiedUsers,
    unverifiedUsers,
    googleUsers,
    localUsers,
    hybridUsers,
    totalFiles,
    totalShares,
    activeAlerts,
  };
}

export async function listAdminUsers(params: {
  search?: string;
  provider?: AuthProvider;
  role?: Role;
  status?: UserStatus;
}) {
  const whereClause: any = {};
  const AND: any[] = [];

  if (params.search && params.search.trim().length > 0) {
    const searchStr = params.search.trim();
    AND.push({
      OR: [
        { email: { contains: searchStr, mode: 'insensitive' } },
        { id: { contains: searchStr, mode: 'insensitive' } },
        { googleId: { contains: searchStr, mode: 'insensitive' } },
      ],
    });
  }

  if (params.provider) {
    AND.push({ authProvider: params.provider });
  }

  if (params.role) {
    AND.push({ role: params.role });
  }

  if (params.status) {
    AND.push({ status: params.status });
  }

  if (AND.length > 0) {
    whereClause.AND = AND;
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      authProvider: true,
      emailVerified: true,
      lastLoginAt: true,
      lastLoginIp: true,
      createdAt: true,
      _count: {
        select: {
          ownedFiles: true,
          sharesGiven: true,
          sharesReceived: true,
        },
      },
    },
  });

  return users;
}

export async function getAdminUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      authProvider: true,
      emailVerified: true,
      failedLoginAttempts: true,
      lockoutUntil: true,
      lastLoginAt: true,
      lastLoginIp: true,
      lastLoginUserAgent: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          ownedFiles: true,
          sharesGiven: true,
          sharesReceived: true,
          securityAlerts: true,
          activityLogs: true,
        },
      },
    },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  const recentLogs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: 15,
  });

  return { user, recentLogs };
}

export async function suspendUserAccount(adminId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  if (adminId === targetUserId) {
    throw { statusCode: 400, message: 'Admins cannot suspend their own account.' };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw { statusCode: 404, message: 'Target user not found.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: UserStatus.SUSPENDED },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId },
    data: { revoked: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminId,
      actionType: 'ADMIN_USER_SUSPENDED',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: target.email },
    },
  });

  return updatedUser;
}

export async function activateUserAccount(adminId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw { statusCode: 404, message: 'Target user not found.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminId,
      actionType: 'ADMIN_USER_ACTIVATED',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: target.email },
    },
  });

  return updatedUser;
}

export async function revokeUserSessions(adminId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw { statusCode: 404, message: 'Target user not found.' };
  }

  const result = await prisma.refreshToken.updateMany({
    where: { userId: targetUserId, revoked: false },
    data: { revoked: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminId,
      actionType: 'ADMIN_USER_SESSIONS_REVOKED',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: target.email, count: result.count },
    },
  });

  return { message: `Revoked ${result.count} active sessions for ${target.email}.` };
}

export async function resetUserAccount(adminId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw { statusCode: 404, message: 'Target user not found.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId },
    data: { revoked: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminId,
      actionType: 'ADMIN_USER_ACCOUNT_RESET',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: target.email },
    },
  });

  return { message: `Account status and security state reset for ${target.email}.`, user: updatedUser };
}

export async function deleteUserAccount(adminId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  if (adminId === targetUserId) {
    throw { statusCode: 400, message: 'Admins cannot delete their own account.' };
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw { statusCode: 404, message: 'Target user not found.' };
  }

  await prisma.user.delete({
    where: { id: targetUserId },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminId,
      actionType: 'ADMIN_USER_DELETED',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: target.email },
    },
  });

  return { message: `User account ${target.email} deleted permanently.` };
}

export async function getAdminAuditLogs(params: {
  search?: string;
  actionType?: string;
  page?: number;
  limit?: number;
}) {
  const safePage = Math.max(1, params.page || 1);
  const safeLimit = Math.max(1, Math.min(100, params.limit || 20));
  const skip = (safePage - 1) * safeLimit;

  const whereClause: any = {};
  const AND: any[] = [];

  if (params.actionType && params.actionType !== 'ALL') {
    AND.push({ actionType: params.actionType });
  }

  if (params.search && params.search.trim().length > 0) {
    const searchStr = params.search.trim();
    AND.push({
      OR: [
        { actionType: { contains: searchStr, mode: 'insensitive' } },
        { ipAddress: { contains: searchStr, mode: 'insensitive' } },
        { user: { email: { contains: searchStr, mode: 'insensitive' } } },
      ],
    });
  }

  if (AND.length > 0) {
    whereClause.AND = AND;
  }

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip,
      take: safeLimit,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    }),
    prisma.activityLog.count({ where: whereClause }),
  ]);

  return {
    logs,
    totalCount,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(totalCount / safeLimit),
  };
}

export async function getAdminSecurityAlerts(params: {
  riskLevel?: string;
  resolved?: boolean;
}) {
  const whereClause: any = {};
  if (params.riskLevel && params.riskLevel !== 'ALL') {
    whereClause.riskLevel = params.riskLevel;
  }
  if (typeof params.resolved === 'boolean') {
    whereClause.resolved = params.resolved;
  }

  const alerts = await prisma.securityAlert.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: {
      user: {
        select: { id: true, email: true, role: true },
      },
    },
  });

  return { alerts };
}

export async function getAdminAdaptiveDecisions() {
  const decisions = await prisma.adaptiveSecurityDecision.findMany({
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: {
      user: {
        select: { id: true, email: true, role: true },
      },
      file: {
        select: { id: true, originalFilename: true, sensitivity: true },
      },
    },
  });

  return { decisions };
}
