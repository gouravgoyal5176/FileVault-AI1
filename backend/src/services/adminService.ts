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

export async function getAdminUserDetails(targetUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
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
    where: { userId: targetUserId },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });

  return {
    user,
    recentLogs,
  };
}

export async function suspendUserAccount(adminUserId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  if (adminUserId === targetUserId) {
    throw { statusCode: 400, message: 'Administrator cannot suspend their own account.' };
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  if (targetUser.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN, status: UserStatus.ACTIVE } });
    if (adminCount <= 1) {
      throw { statusCode: 400, message: 'Cannot suspend the last remaining active administrator account.' };
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: UserStatus.SUSPENDED },
    select: { id: true, email: true, status: true, role: true },
  });

  // Revoke all active sessions
  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId },
    data: { revoked: true },
  });

  // Log admin action
  await prisma.activityLog.create({
    data: {
      userId: adminUserId,
      actionType: 'ADMIN_SUSPENDED_USER',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: targetUser.email },
    },
  });

  return updatedUser;
}

export async function activateUserAccount(adminUserId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: UserStatus.ACTIVE },
    select: { id: true, email: true, status: true, role: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminUserId,
      actionType: 'ADMIN_ACTIVATED_USER',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: targetUser.email },
    },
  });

  return updatedUser;
}

export async function revokeUserSessions(adminUserId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId },
    data: { revoked: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminUserId,
      actionType: 'ADMIN_REVOKED_SESSIONS',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: targetUser.email },
    },
  });

  return { message: `All active sessions revoked for user ${targetUser.email}.` };
}

export async function resetUserAccount(adminUserId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  // Revoke refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId: targetUserId },
    data: { revoked: true },
  });

  // Reset failed login counters and lockout status
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminUserId,
      actionType: 'ADMIN_RESET_USER',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { targetEmail: targetUser.email },
    },
  });

  return { message: `Account reset completed successfully for user ${targetUser.email}.` };
}

export async function deleteUserAccount(adminUserId: string, targetUserId: string, ipAddress: string, userAgent: string) {
  if (adminUserId === targetUserId) {
    throw { statusCode: 400, message: 'Administrator cannot delete their own logged-in account.' };
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  if (targetUser.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      throw { statusCode: 400, message: 'Cannot delete the last remaining administrator account.' };
    }
  }

  const targetEmail = targetUser.email;

  // Perform clean deletion of user account
  await prisma.user.delete({
    where: { id: targetUserId },
  });

  // Log admin action (userId is SetNull by Prisma relation on delete)
  await prisma.activityLog.create({
    data: {
      userId: adminUserId,
      actionType: 'ADMIN_DELETED_USER',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: { deletedEmail: targetEmail },
    },
  });

  return { message: `User account '${targetEmail}' permanently deleted. The email address is now available for fresh registration.` };
}

export async function getAdminAuditLogs(params: {
  search?: string;
  actionType?: string;
  page?: number;
  limit?: number;
}) {
  const safeLimit = Math.max(1, Math.min(50, params.limit || 20));
  const safePage = Math.max(1, params.page || 1);
  const skip = (safePage - 1) * safeLimit;

  const whereClause: any = {};

  if (params.actionType && params.actionType.trim().length > 0) {
    whereClause.actionType = params.actionType.trim();
  }

  if (params.search && params.search.trim().length > 0) {
    const term = params.search.trim();
    whereClause.OR = [
      { actionType: { contains: term, mode: 'insensitive' } },
      { ipAddress: { contains: term, mode: 'insensitive' } },
      { userAgent: { contains: term, mode: 'insensitive' } },
      { user: { email: { contains: term, mode: 'insensitive' } } },
    ];
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

