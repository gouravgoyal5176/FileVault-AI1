import { prisma } from '../config/db';
import { RiskLevel } from '@prisma/client';

export interface FeatureVector {
  f1_activityFrequency: number;     // weight 0.10
  f2_failedLoginFrequency: number;  // weight 0.20
  f3_downloadFrequency: number;     // weight 0.20
  f4_unusualLoginTime: number;      // weight 0.15
  f5_ipChange: number;              // weight 0.15
  f6_deviceChange: number;          // weight 0.10
  f7_activityBurst: number;         // weight 0.10
}

export interface AnomalyEvaluationResult {
  evaluatedAt: string;
  userId: string;
  anomalyScore: number;             // 0.00 to 1.00
  riskCategory: 'NORMAL' | 'MEDIUM_ANOMALY' | 'HIGH_ANOMALY';
  status: 'EVALUATED' | 'INSUFFICIENT_DATA';
  alertGenerated: boolean;
  alertSuppressed: boolean;
  featureVector: FeatureVector;
  metrics: {
    totalHistoryLogs: number;
    activity24h: number;
    baselineDailyAvg: number;
    failedLogins24h: number;
    downloads1h: number;
    currentHour: number;
    medianHour: number;
    isNewIp: boolean;
    isNewDevice: boolean;
    lastTimeGapSeconds: number | null;
  };
}

export async function calculateBehavioralAnomaly(
  userId: string,
  targetEvaluatedAt?: Date,
  currentIp?: string,
  currentUserAgent?: string
): Promise<AnomalyEvaluationResult> {
  const evaluatedAt = targetEvaluatedAt ? new Date(targetEvaluatedAt) : new Date();

  // Baseline Window: 14 days strictly prior to evaluatedAt
  const fourteenDaysAgo = new Date(evaluatedAt.getTime() - 14 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(evaluatedAt.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(evaluatedAt.getTime() - 60 * 60 * 1000);

  // Fetch historical ActivityLog records created strictly earlier than evaluatedAt
  const historyLogs = await prisma.activityLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: fourteenDaysAgo,
        lt: evaluatedAt,
      },
    },
    orderBy: { timestamp: 'desc' },
    select: {
      actionType: true,
      ipAddress: true,
      userAgent: true,
      timestamp: true,
    },
  });

  const totalHistoryLogs = historyLogs.length;

  // Cold Start Protection: If fewer than 5 historical records exist, return INSUFFICIENT_DATA
  if (totalHistoryLogs < 5) {
    return {
      evaluatedAt: evaluatedAt.toISOString(),
      userId,
      anomalyScore: 0.0,
      riskCategory: 'NORMAL',
      status: 'INSUFFICIENT_DATA',
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
        totalHistoryLogs,
        activity24h: 0,
        baselineDailyAvg: 0,
        failedLogins24h: 0,
        downloads1h: 0,
        currentHour: evaluatedAt.getHours(),
        medianHour: evaluatedAt.getHours(),
        isNewIp: false,
        isNewDevice: false,
        lastTimeGapSeconds: null,
      },
    };
  }

  // --- FEATURE EXTRACTION & CALCULATION ---

  // 1. f1: Activity Frequency Anomaly (weight 0.10)
  const logs24h = historyLogs.filter((log) => log.timestamp >= twentyFourHoursAgo);
  const activity24h = logs24h.length;
  // Calculate average daily activity over prior 14 days (minimum baseline 5.0)
  const baselineDailyAvg = Math.max(5.0, totalHistoryLogs / 14.0);
  const f1_raw = Math.abs(activity24h - baselineDailyAvg) / baselineDailyAvg;
  const f1_activityFrequency = Math.max(0.0, Math.min(1.0, f1_raw));

  // 2. f2: Failed Login Frequency Anomaly (weight 0.20)
  const failedLogins24h = logs24h.filter((log) => log.actionType === 'LOGIN_FAILED').length;
  const f2_failedLoginFrequency = Math.max(0.0, Math.min(1.0, failedLogins24h / 5.0));

  // 3. f3: Download Frequency Anomaly (weight 0.20)
  const downloads1h = historyLogs.filter(
    (log) => log.timestamp >= oneHourAgo && log.actionType === 'FILE_DOWNLOADED'
  ).length;
  const f3_downloadFrequency = Math.max(0.0, Math.min(1.0, downloads1h / 5.0));

  // 4. f4: Unusual Login Time Anomaly (weight 0.15)
  const currentHour = evaluatedAt.getHours();
  const historicalHours = historyLogs.map((log) => log.timestamp.getHours()).sort((a, b) => a - b);
  const medianHour = historicalHours[Math.floor(historicalHours.length / 2)] ?? currentHour;
  const diffHours = Math.abs(currentHour - medianHour);
  const angularDiff = Math.min(diffHours, 24 - diffHours);
  const f4_unusualLoginTime = Math.max(0.0, Math.min(1.0, angularDiff / 12.0));

  // 5. f5: IP Change Anomaly (weight 0.15)
  const reqIp = currentIp || historyLogs[0]?.ipAddress || '';
  const historicalIps = new Set(historyLogs.map((log) => log.ipAddress));
  const isNewIp = reqIp.length > 0 && !historicalIps.has(reqIp);
  const f5_ipChange = isNewIp ? 1.0 : 0.0;

  // 6. f6: Device/User-Agent Change Anomaly (weight 0.10)
  const reqUa = currentUserAgent || historyLogs[0]?.userAgent || '';
  const historicalUas = new Set(historyLogs.map((log) => log.userAgent));
  const isNewDevice = reqUa.length > 0 && !historicalUas.has(reqUa);
  const f6_deviceChange = isNewDevice ? 1.0 : 0.0;

  // 7. f7: Activity Burst / Time-Gap Anomaly (weight 0.10)
  // Evaluates rapid consecutive activity bursts
  let lastTimeGapSeconds: number | null = null;
  let f7_activityBurst = 0.0;
  if (historyLogs.length > 0) {
    const mostRecentTimestamp = historyLogs[0].timestamp;
    lastTimeGapSeconds = Math.max(0, (evaluatedAt.getTime() - mostRecentTimestamp.getTime()) / 1000.0);

    if (lastTimeGapSeconds < 2.0) {
      f7_activityBurst = 1.0; // Rapid burst detection
    } else if (lastTimeGapSeconds <= 300.0) {
      f7_activityBurst = Math.max(0.0, 1.0 - (lastTimeGapSeconds - 2.0) / 298.0);
    } else {
      f7_activityBurst = 0.0; // Gaps > 300s represent low burst-anomaly evidence
    }
  }

  // --- WEIGHTED SUM & ANOMALY SCORE COMPUTATION ---
  const rawScore =
    0.10 * f1_activityFrequency +
    0.20 * f2_failedLoginFrequency +
    0.20 * f3_downloadFrequency +
    0.15 * f4_unusualLoginTime +
    0.15 * f5_ipChange +
    0.10 * f6_deviceChange +
    0.10 * f7_activityBurst;

  const anomalyScore = Math.max(0.0, Math.min(1.0, parseFloat(rawScore.toFixed(2))));

  let riskCategory: 'NORMAL' | 'MEDIUM_ANOMALY' | 'HIGH_ANOMALY';
  if (anomalyScore >= 0.75) riskCategory = 'HIGH_ANOMALY';
  else if (anomalyScore >= 0.50) riskCategory = 'MEDIUM_ANOMALY';
  else riskCategory = 'NORMAL';

  // --- DEDUPLICATION & CORRELATION ALERT LOGIC ---
  let alertGenerated = false;
  let alertSuppressed = false;

  if (anomalyScore >= 0.50) {
    const fifteenMinutesAgo = new Date(evaluatedAt.getTime() - 15 * 60 * 1000);

    // Safe Deduplication Check: Prevent duplicate alerts if a BEHAVIORAL_ANOMALY or BRUTE_FORCE_LOCKOUT alert exists in the last 15 min
    const existingRecentAlert = await prisma.securityAlert.findFirst({
      where: {
        userId,
        alertType: { in: ['BEHAVIORAL_ANOMALY', 'BRUTE_FORCE_LOCKOUT'] },
        timestamp: { gte: fifteenMinutesAgo },
      },
    });

    if (existingRecentAlert) {
      alertSuppressed = true;
    } else {
      const riskLevel = riskCategory === 'HIGH_ANOMALY' ? RiskLevel.HIGH : RiskLevel.MEDIUM;
      const description = `Behavioral anomaly detected (Score: ${anomalyScore.toFixed(2)}): ${
        isNewIp ? 'Novel IP origin; ' : ''
      }${isNewDevice ? 'Novel device signature; ' : ''}${
        failedLogins24h > 0 ? `${failedLogins24h} recent failed logins; ` : ''
      }${downloads1h > 0 ? `${downloads1h} downloads/hr; ` : ''}Off-peak hour evaluation.`;

      await prisma.securityAlert.create({
        data: {
          userId,
          alertType: 'BEHAVIORAL_ANOMALY',
          riskLevel,
          description,
          timestamp: evaluatedAt,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          actionType: 'BEHAVIORAL_ANOMALY_DETECTED',
          ipAddress: reqIp || '127.0.0.1',
          userAgent: reqUa || 'FileVault-AI-Engine',
          timestamp: evaluatedAt,
          metadata: {
            anomalyScore,
            riskCategory,
            featureVector: {
              f1_activityFrequency,
              f2_failedLoginFrequency,
              f3_downloadFrequency,
              f4_unusualLoginTime,
              f5_ipChange,
              f6_deviceChange,
              f7_activityBurst,
            },
          },
        },
      });

      alertGenerated = true;
    }
  }

  return {
    evaluatedAt: evaluatedAt.toISOString(),
    userId,
    anomalyScore,
    riskCategory,
    status: 'EVALUATED',
    alertGenerated,
    alertSuppressed,
    featureVector: {
      f1_activityFrequency,
      f2_failedLoginFrequency,
      f3_downloadFrequency,
      f4_unusualLoginTime,
      f5_ipChange,
      f6_deviceChange,
      f7_activityBurst,
    },
    metrics: {
      totalHistoryLogs,
      activity24h,
      baselineDailyAvg,
      failedLogins24h,
      downloads1h,
      currentHour,
      medianHour,
      isNewIp,
      isNewDevice,
      lastTimeGapSeconds,
    },
  };
}
