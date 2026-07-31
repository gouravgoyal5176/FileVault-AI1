import { prisma } from '../config/db';
import { RiskLevel } from '@prisma/client';
import { calculateBehavioralAnomaly } from './anomalyDetectionService';

const BULK_DOWNLOAD_THRESHOLD = 5;
const BULK_DOWNLOAD_WINDOW_MINUTES = 5;

export async function checkUnusualAccess(userId: string, ipAddress: string, userAgent: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLoginIp: true, lastLoginUserAgent: true, lastLoginAt: true },
  });

  if (!user || !user.lastLoginIp) {
    // First login, not unusual yet
    return { isUnusual: false };
  }

  const isNewIp = user.lastLoginIp !== ipAddress;
  const isNewDevice = user.lastLoginUserAgent !== userAgent;

  if (isNewIp || isNewDevice) {
    const reasonParts = [];
    if (isNewIp) reasonParts.push(`New IP (${ipAddress})`);
    if (isNewDevice) reasonParts.push(`New Device/Browser`);

    const description = `Unusual login location/device detected: ${reasonParts.join(', ')}. Previous IP: ${user.lastLoginIp}`;

    // Create Security Alert
    await prisma.securityAlert.create({
      data: {
        userId,
        alertType: 'UNUSUAL_ACCESS',
        riskLevel: RiskLevel.MEDIUM,
        description,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        actionType: 'UNUSUAL_LOGIN_DETECTED',
        ipAddress,
        userAgent,
        metadata: {
          previousIp: user.lastLoginIp,
          newIp: ipAddress,
          isNewDevice,
        },
      },
    });

    return { isUnusual: true, reason: description };
  }

  return { isUnusual: false };
}

export async function trackDownloadSpike(userId: string, ipAddress: string, userAgent: string) {
  const windowStart = new Date(Date.now() - BULK_DOWNLOAD_WINDOW_MINUTES * 60 * 1000);

  // Count file downloads by user in sliding time window
  const recentDownloadCount = await prisma.activityLog.count({
    where: {
      userId,
      actionType: 'FILE_DOWNLOADED',
      timestamp: {
        gte: windowStart,
      },
    },
  });

  if (recentDownloadCount >= BULK_DOWNLOAD_THRESHOLD) {
    const description = `Abnormal download volume spike detected: ${recentDownloadCount} files downloaded within ${BULK_DOWNLOAD_WINDOW_MINUTES} minutes.`;

    // Check if alert already raised within window to prevent log spam
    const existingAlert = await prisma.securityAlert.findFirst({
      where: {
        userId,
        alertType: 'BULK_DOWNLOAD_SPIKE',
        timestamp: { gte: windowStart },
      },
    });

    if (!existingAlert) {
      await prisma.securityAlert.create({
        data: {
          userId,
          alertType: 'BULK_DOWNLOAD_SPIKE',
          riskLevel: RiskLevel.HIGH,
          description,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          actionType: 'BULK_DOWNLOAD_SPIKE_DETECTED',
          ipAddress,
          userAgent,
          metadata: { downloadCount: recentDownloadCount, windowMinutes: BULK_DOWNLOAD_WINDOW_MINUTES },
        },
      });
    }

    return { isSpike: true, downloadCount: recentDownloadCount };
  }

  return { isSpike: false, downloadCount: recentDownloadCount };
}

export async function evaluateBehavioralAnomaly(userId: string, ipAddress?: string, userAgent?: string) {
  try {
    return await calculateBehavioralAnomaly(userId, undefined, ipAddress, userAgent);
  } catch (error: any) {
    console.warn('[AI Anomaly Engine Fail-Open Notice]: Anomaly evaluation warning:', error?.message || error);
    // Fail-open safely returning neutral score without disrupting application execution
    return {
      evaluatedAt: new Date().toISOString(),
      userId,
      anomalyScore: 0.0,
      riskCategory: 'NORMAL' as const,
      status: 'INSUFFICIENT_DATA' as const,
      alertGenerated: false,
      alertSuppressed: false,
      featureVector: {
        f1_activityFrequency: 0.0,
        f2_failedLoginFrequency: 0.0,
        f3_downloadFrequency: 0.0,
        f4_unusualLoginTime: 0.0,
        f5_ipChange: 0.0,
        f6_deviceChange: 0.0,
        f7_activityBurst: 0.0,
      },
      metrics: {
        totalHistoryLogs: 0,
        activity24h: 0,
        baselineDailyAvg: 0,
        failedLogins24h: 0,
        downloads1h: 0,
        currentHour: new Date().getHours(),
        medianHour: new Date().getHours(),
        isNewIp: false,
        isNewDevice: false,
        lastTimeGapSeconds: null,
      },
    };
  }
}

export async function getUserSecurityAlerts(userId: string) {
  return prisma.securityAlert.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
  });
}

export async function getSecurityThreatSummary(userId: string) {
  const [totalAlerts, activeAlerts, criticalAlerts] = await Promise.all([
    prisma.securityAlert.count({ where: { userId } }),
    prisma.securityAlert.count({ where: { userId, resolved: false } }),
    prisma.securityAlert.count({ where: { userId, riskLevel: RiskLevel.CRITICAL, resolved: false } }),
  ]);

  return {
    totalAlerts,
    activeAlerts,
    criticalAlerts,
    threatLevel: criticalAlerts > 0 ? 'HIGH' : activeAlerts > 0 ? 'ELEVATED' : 'NORMAL',
  };
}
