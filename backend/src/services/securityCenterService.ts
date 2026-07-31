import { prisma } from '../config/db';
import { IntegrityStatus, RiskLevel } from '@prisma/client';

export interface ScoreBreakdown {
  evaluatedAt: string;
  vaultIntegrityScore: number; // 0 - 25
  sessionHygieneScore: number; // 0 - 25
  activeThreatScore: number;   // 0 - 20
  sharingHygieneScore: number; // 0 - 15
  deceptionScore: number;      // 0 - 15
  finalScore: number;          // 0 - 100
  rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CRITICAL_RISK';
  metrics: {
    totalFiles: number;
    tamperedFiles: number;
    recentFailedLogins: number;
    isLockedOut: boolean;
    activeCriticalAlerts: number;
    activeHighAlerts: number;
    activeMediumAlerts: number;
    expiredSharesCount: number;
    indefiniteSharesCount: number;
    honeyfilesCount: number;
  };
}

export async function calculateSecurityScore(userId: string, targetEvaluatedAt?: Date): Promise<ScoreBreakdown> {
  const evaluatedAt = targetEvaluatedAt ? new Date(targetEvaluatedAt) : new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true, lockoutUntil: true },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }

  // 1. Vault Integrity Vector (Max 25 pts)
  const totalFiles = await prisma.file.count({ where: { ownerId: userId, createdAt: { lte: evaluatedAt } } });
  const tamperedFiles = await prisma.file.count({
    where: { ownerId: userId, integrityStatus: IntegrityStatus.TAMPERED, createdAt: { lte: evaluatedAt } },
  });

  let vaultIntegrityScore = 25;
  if (totalFiles > 0) {
    const tamperedRatio = tamperedFiles / totalFiles;
    vaultIntegrityScore = Math.max(0, Math.min(25, Math.round(25 * (1 - tamperedRatio))));
  }

  // 2. Authentication & Session Hygiene Vector (Max 25 pts)
  const isLockedOut = !!(user.lockoutUntil && user.lockoutUntil > evaluatedAt);
  let sessionHygieneScore = 25;
  let recentFailedLogins = 0;

  if (isLockedOut) {
    sessionHygieneScore = 0;
  } else {
    const sevenDaysAgo = new Date(evaluatedAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    recentFailedLogins = await prisma.activityLog.count({
      where: {
        userId,
        actionType: 'LOGIN_FAILED',
        timestamp: { gte: sevenDaysAgo, lte: evaluatedAt },
      },
    });
    sessionHygieneScore = Math.max(0, Math.min(25, 25 - recentFailedLogins * 3));
  }

  // 3. Active Threat / Alert Status Vector (Max 20 pts)
  const activeAlerts = await prisma.securityAlert.findMany({
    where: { userId, resolved: false, timestamp: { lte: evaluatedAt } },
    select: { riskLevel: true },
  });

  let activeCriticalAlerts = 0;
  let activeHighAlerts = 0;
  let activeMediumAlerts = 0;

  for (const alert of activeAlerts) {
    if (alert.riskLevel === RiskLevel.CRITICAL) activeCriticalAlerts++;
    else if (alert.riskLevel === RiskLevel.HIGH) activeHighAlerts++;
    else if (alert.riskLevel === RiskLevel.MEDIUM) activeMediumAlerts++;
  }

  const alertDeduction = activeCriticalAlerts * 10 + activeHighAlerts * 6 + activeMediumAlerts * 3;
  const activeThreatScore = Math.max(0, Math.min(20, 20 - alertDeduction));

  // 4. File Sharing Hygiene Vector (Max 15 pts)
  const userShares = await prisma.fileShare.findMany({
    where: { sharedById: userId, createdAt: { lte: evaluatedAt } },
    select: { expiresAt: true },
  });

  let expiredSharesCount = 0;
  let indefiniteSharesCount = 0;

  for (const share of userShares) {
    if (share.expiresAt && share.expiresAt < evaluatedAt) {
      expiredSharesCount++;
    } else if (!share.expiresAt) {
      indefiniteSharesCount++;
    }
  }

  const indefiniteDeduction = indefiniteSharesCount > 3 ? (indefiniteSharesCount - 3) * 2 : 0;
  const sharingHygieneScore = Math.max(0, Math.min(15, 15 - (expiredSharesCount * 5 + indefiniteDeduction)));

  // 5. Deception / Honeyfile Protection Vector (Max 15 pts)
  const honeyfilesCount = await prisma.file.count({
    where: { ownerId: userId, isHoneyfile: true, createdAt: { lte: evaluatedAt } },
  });
  const deceptionScore = honeyfilesCount > 0 ? 15 : 0;

  // Final Clamped Score Calculation
  const total = vaultIntegrityScore + sessionHygieneScore + activeThreatScore + sharingHygieneScore + deceptionScore;
  const finalScore = Math.max(0, Math.min(100, Math.round(total)));

  let rating: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'CRITICAL_RISK';
  if (finalScore >= 85) rating = 'EXCELLENT';
  else if (finalScore >= 70) rating = 'GOOD';
  else if (finalScore >= 50) rating = 'MODERATE';
  else rating = 'CRITICAL_RISK';

  return {
    evaluatedAt: evaluatedAt.toISOString(),
    vaultIntegrityScore,
    sessionHygieneScore,
    activeThreatScore,
    sharingHygieneScore,
    deceptionScore,
    finalScore,
    rating,
    metrics: {
      totalFiles,
      tamperedFiles,
      recentFailedLogins,
      isLockedOut,
      activeCriticalAlerts,
      activeHighAlerts,
      activeMediumAlerts,
      expiredSharesCount,
      indefiniteSharesCount,
      honeyfilesCount,
    },
  };
}

export async function saveScoreSnapshot(userId: string) {
  const breakdown = await calculateSecurityScore(userId);

  const snapshot = await prisma.securityScoreSnapshot.create({
    data: {
      userId,
      score: breakdown.finalScore,
      rating: breakdown.rating,
      breakdown: breakdown as any,
    } as any,
  });

  return { snapshot, breakdown };
}

export async function getAuditLogs(
  userId: string,
  actionType?: string,
  startDate?: string,
  endDate?: string,
  search?: string,
  page: number = 1,
  limit: number = 10
) {
  // Cap max page size strictly at 50
  const safeLimit = Math.max(1, Math.min(50, limit));
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const whereClause: any = {
    userId,
  };

  if (actionType && actionType.trim().length > 0) {
    whereClause.actionType = actionType.trim();
  }

  if (startDate || endDate) {
    whereClause.timestamp = {};
    if (startDate) whereClause.timestamp.gte = new Date(startDate);
    if (endDate) whereClause.timestamp.lte = new Date(endDate);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim();
    whereClause.OR = [
      { actionType: { contains: term, mode: 'insensitive' } },
      { ipAddress: { contains: term, mode: 'insensitive' } },
      { userAgent: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip,
      take: safeLimit,
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

export async function getAdminSecurityOverview() {
  const [totalUsers, lockedAccountsCount, tamperedFilesCount, criticalAlerts, highAlerts, mediumAlerts, lowAlerts, honeyfilesCount, suspiciousEventsCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lockoutUntil: { gt: new Date() } } }),
    prisma.file.count({ where: { integrityStatus: IntegrityStatus.TAMPERED } }),
    prisma.securityAlert.count({ where: { riskLevel: RiskLevel.CRITICAL, resolved: false } }),
    prisma.securityAlert.count({ where: { riskLevel: RiskLevel.HIGH, resolved: false } }),
    prisma.securityAlert.count({ where: { riskLevel: RiskLevel.MEDIUM, resolved: false } }),
    prisma.securityAlert.count({ where: { riskLevel: RiskLevel.LOW, resolved: false } }),
    prisma.file.count({ where: { isHoneyfile: true } }),
    prisma.activityLog.count({
      where: {
        actionType: {
          in: ['HONEYFILE_ACCESSED', 'FILE_TAMPER_DETECTED', 'BRUTE_FORCE_LOCKOUT', 'BULK_DOWNLOAD_SPIKE_DETECTED', 'UNUSUAL_LOGIN_DETECTED'],
        },
      },
    }),
  ]);

  return {
    totalUsers,
    lockedAccountsCount,
    tamperedFilesCount,
    alertsBySeverity: {
      CRITICAL: criticalAlerts,
      HIGH: highAlerts,
      MEDIUM: mediumAlerts,
      LOW: lowAlerts,
    },
    honeyfilesCount,
    suspiciousEventsCount,
    systemIntegrityStatus: tamperedFilesCount === 0 && criticalAlerts === 0 ? 'HEALTHY' : 'ELEVATED_RISK',
  };
}
