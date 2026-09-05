import { prisma } from '../config/db';
import { RiskLevel, FileSensitivity } from '@prisma/client';
import { calculateBehavioralAnomaly } from './anomalyDetectionService';

export const SENSITIVITY_SCORES: Record<FileSensitivity, number> = {
  PUBLIC: 10,
  INTERNAL: 30,
  CONFIDENTIAL: 60,
  RESTRICTED: 80,
  CRITICAL: 100,
};

export interface RiskFactor {
  factor: string;
  points: number;
  description: string;
}

export interface RiskEvaluationResult {
  userId: string;
  riskScore: number;       // 0 to 100
  riskLevel: RiskLevel;   // LOW, MEDIUM, HIGH, CRITICAL
  reasons: string[];
  factors: RiskFactor[];
  details: {
    isNewIp: boolean;
    isNewDevice: boolean;
    failedLoginCount24h: number;
    anomalyScore: number;
    activeAlertsCount: number;
    honeyfileTriggered24h: boolean;
    downloadSpike24h: boolean;
  };
}

function normalizeIp(ip?: string): string {
  if (!ip) return '';
  const cleaned = ip.trim().toLowerCase();
  if (cleaned === '::1' || cleaned === '::ffff:127.0.0.1' || cleaned === 'localhost') {
    return '127.0.0.1';
  }
  if (cleaned.startsWith('::ffff:')) {
    return cleaned.replace('::ffff:', '');
  }
  return cleaned;
}

export function getRiskLevelFromScore(score: number): RiskLevel {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 70) return RiskLevel.CRITICAL;
  if (clamped >= 40) return RiskLevel.HIGH;
  if (clamped >= 20) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

export async function calculateUserRiskScore(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<RiskEvaluationResult> {
  const reasons: string[] = [];
  const factors: RiskFactor[] = [];
  let score = 0;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Fetch user login metadata
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastLoginIp: true,
      lastLoginUserAgent: true,
      failedLoginAttempts: true,
    },
  });

  // 2. Evaluate IP & Device Novelty safely
  const normCurrentIp = normalizeIp(ipAddress);
  const normLastIp = normalizeIp(user?.lastLoginIp || '');

  // Only flag new IP if user has a recorded lastLoginIp AND it differs after normalization
  const isNewIp = Boolean(normLastIp && normCurrentIp && normLastIp !== normCurrentIp);

  // Device check: Compare user agent if present (ignore generic 'Browser' or missing UA)
  const currentUa = userAgent?.trim() || '';
  const lastUa = user?.lastLoginUserAgent?.trim() || '';
  const isNewDevice = Boolean(lastUa && currentUa && currentUa !== 'Browser' && lastUa !== currentUa);

  if (isNewIp) {
    score += 15;
    reasons.push('Unrecognized IP origin');
    factors.push({ factor: 'IP_NOVELTY', points: 15, description: 'Unrecognized IP origin' });
  }

  if (isNewDevice) {
    score += 15;
    reasons.push('Unrecognized browser or device signature');
    factors.push({ factor: 'DEVICE_NOVELTY', points: 15, description: 'Unrecognized browser or device signature' });
  }

  // 3. Failed Authentication Telemetry
  const failedLogins24h = await prisma.activityLog.count({
    where: {
      userId,
      actionType: 'LOGIN_FAILED',
      timestamp: { gte: twentyFourHoursAgo },
    },
  });

  const failedLoginPenalty = Math.min(30, failedLogins24h * 10);
  if (failedLoginPenalty > 0) {
    score += failedLoginPenalty;
    reasons.push(`${failedLogins24h} recent failed authentication attempt(s)`);
    factors.push({
      factor: 'FAILED_LOGINS',
      points: failedLoginPenalty,
      description: `${failedLogins24h} recent failed authentication attempt(s)`,
    });
  }

  // 4. Behavioral Anomaly Score Integration (read-only evaluation)
  let anomalyScore = 0;
  try {
    const anomalyResult = await calculateBehavioralAnomaly(userId, now, ipAddress, userAgent, false);
    anomalyScore = anomalyResult.anomalyScore;
    if (anomalyScore >= 0.5) {
      const anomalyPenalty = Math.round(anomalyScore * 25);
      if (anomalyPenalty > 0) {
        score += anomalyPenalty;
        reasons.push(`Behavioral anomaly detected (Score: ${anomalyScore.toFixed(2)})`);
        factors.push({
          factor: 'BEHAVIORAL_ANOMALY',
          points: anomalyPenalty,
          description: `Behavioral anomaly detected (Score: ${anomalyScore.toFixed(2)})`,
        });
      }
    }
  } catch (err: any) {
    console.warn('Risk engine anomaly calculation warning:', err.message);
  }

  // 5. Active Security Alerts & Honeyfile Penalties (Deduplicated)
  const activeAlerts = await prisma.securityAlert.findMany({
    where: {
      userId,
      resolved: false,
      timestamp: { gte: twentyFourHoursAgo },
    },
    orderBy: { timestamp: 'desc' },
  });

  let honeyfileTriggered24h = false;
  let downloadSpike24h = false;

  // Deduplicate alert penalties by type to avoid stacking historical test runs
  const alertTypesSeen = new Set<string>();
  let alertPenaltyTotal = 0;

  for (const alert of activeAlerts) {
    if (alert.alertType === 'HONEYFILE_ACCESSED' || alert.alertType === 'HONEYFILE_TRAP_TRIGGERED') {
      honeyfileTriggered24h = true;
      if (!alertTypesSeen.has('HONEYFILE')) {
        alertTypesSeen.add('HONEYFILE');
        alertPenaltyTotal += 50;
        reasons.push('Honeyfile decoy trap accessed');
        factors.push({ factor: 'HONEYFILE_TRAP', points: 50, description: 'Honeyfile decoy trap accessed' });
      }
    } else if (alert.alertType === 'BULK_DOWNLOAD_SPIKE') {
      downloadSpike24h = true;
      if (!alertTypesSeen.has('SPIKE')) {
        alertTypesSeen.add('SPIKE');
        alertPenaltyTotal += 25;
        reasons.push('Abnormal download volume spike');
        factors.push({ factor: 'DOWNLOAD_SPIKE', points: 25, description: 'Abnormal download volume spike' });
      }
    } else if (alert.riskLevel === RiskLevel.CRITICAL) {
      if (!alertTypesSeen.has('CRITICAL_ALERT')) {
        alertTypesSeen.add('CRITICAL_ALERT');
        alertPenaltyTotal += 25;
        reasons.push(`Critical alert: ${alert.alertType}`);
        factors.push({ factor: 'CRITICAL_ALERT', points: 25, description: `Critical alert: ${alert.alertType}` });
      }
    } else if (alert.riskLevel === RiskLevel.HIGH) {
      if (!alertTypesSeen.has('HIGH_ALERT')) {
        alertTypesSeen.add('HIGH_ALERT');
        alertPenaltyTotal += 15;
        reasons.push(`High risk alert: ${alert.alertType}`);
        factors.push({ factor: 'HIGH_ALERT', points: 15, description: `High risk alert: ${alert.alertType}` });
      }
    } else if (alert.riskLevel === RiskLevel.MEDIUM) {
      if (!alertTypesSeen.has('MEDIUM_ALERT')) {
        alertTypesSeen.add('MEDIUM_ALERT');
        alertPenaltyTotal += 10;
        reasons.push(`Medium risk alert: ${alert.alertType}`);
        factors.push({ factor: 'MEDIUM_ALERT', points: 10, description: `Medium risk alert: ${alert.alertType}` });
      }
    }
  }

  score += alertPenaltyTotal;

  // If no risk factors were triggered, present clean baseline explanation
  if (reasons.length === 0) {
    reasons.push('Normal authenticated session');
    reasons.push('No active security alerts');
    reasons.push('No honeyfile access');
    reasons.push('No failed login attempts');
  }

  const finalRiskScore = Math.max(0, Math.min(100, score));
  const riskLevel = getRiskLevelFromScore(finalRiskScore);

  return {
    userId,
    riskScore: finalRiskScore,
    riskLevel,
    reasons,
    factors,
    details: {
      isNewIp,
      isNewDevice,
      failedLoginCount24h: failedLogins24h,
      anomalyScore,
      activeAlertsCount: activeAlerts.length,
      honeyfileTriggered24h,
      downloadSpike24h,
    },
  };
}
