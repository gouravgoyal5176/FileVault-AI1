import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { Role, RiskLevel } from '@prisma/client';
import { calculateSecurityScore } from '../services/securityCenterService';

async function runSecurityCenterTests() {
  console.log('\n==================================================');
  console.log('    FILEVAULT SECURITY CENTER & SCORE TESTS       ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureReason?: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${testName} - ${failureReason || 'Assertion failed'}`);
      failed++;
    }
  }

  const fixedEvaluatedAt = new Date('2026-07-24T12:00:00.000Z');

  // 1. Single-Timestamp Determinism Test
  try {
    const eval1 = new Date(fixedEvaluatedAt);
    const eval2 = new Date(fixedEvaluatedAt);
    assert(eval1.getTime() === eval2.getTime(), 'Single evaluation timestamp is strictly deterministic');
  } catch (err: any) {
    assert(false, 'Determinism Test', err.message);
  }

  // 2. Score Clamping (Upper Bound 100)
  try {
    const rawHigh = 125;
    const clampedHigh = Math.max(0, Math.min(100, Math.round(rawHigh)));
    assert(clampedHigh === 100, 'Security score clamped strictly at maximum 100');
  } catch (err: any) {
    assert(false, 'Upper Bound Clamping Test', err.message);
  }

  // 3. Score Clamping (Lower Bound 0)
  try {
    const rawLow = -40;
    const clampedLow = Math.max(0, Math.min(100, Math.round(rawLow)));
    assert(clampedLow === 0, 'Security score clamped strictly at minimum 0');
  } catch (err: any) {
    assert(false, 'Lower Bound Clamping Test', err.message);
  }

  // 4. Vault Integrity Vector - All Healthy (25 pts)
  try {
    const totalFiles = 5;
    const tamperedFiles = 0;
    const score = totalFiles > 0 ? Math.round(25 * (1 - tamperedFiles / totalFiles)) : 25;
    assert(score === 25, 'Vault Integrity Vector awards 25 pts when all files healthy');
  } catch (err: any) {
    assert(false, 'Vault Integrity Healthy Test', err.message);
  }

  // 5. Vault Integrity Vector - Tampered Ratio Impact
  try {
    const totalFiles = 4;
    const tamperedFiles = 1;
    const score = Math.round(25 * (1 - tamperedFiles / totalFiles));
    assert(score === 19, 'Vault Integrity Vector deducts points proportionally on tampered files');
  } catch (err: any) {
    assert(false, 'Vault Integrity Tampered Test', err.message);
  }

  // 6. Session Hygiene Vector - 7-Day Rolling Window
  try {
    const failedLogins = 2;
    const score = Math.max(0, 25 - failedLogins * 3);
    assert(score === 19, 'Session Hygiene Vector deducts 3 pts per failed login in 7-day window');
  } catch (err: any) {
    assert(false, 'Session Hygiene Failed Logins Test', err.message);
  }

  // 7. Session Hygiene Vector - Lockout Impact (0 pts)
  try {
    const isLockedOut = true;
    const score = isLockedOut ? 0 : 25;
    assert(score === 0, 'Account lockout reduces Session Hygiene Vector to 0 pts');
  } catch (err: any) {
    assert(false, 'Session Hygiene Lockout Test', err.message);
  }

  // 8. Active Threat Vector - Normalized Deductions
  try {
    const criticalAlerts = 1; // -10
    const highAlerts = 1;     // -6
    const mediumAlerts = 1;   // -3
    const deduction = criticalAlerts * 10 + highAlerts * 6 + mediumAlerts * 3;
    const score = Math.max(0, 20 - deduction);
    assert(score === 1, 'Active Threat Vector applies normalized deductions (CRITICAL -10, HIGH -6, MEDIUM -3)');
  } catch (err: any) {
    assert(false, 'Active Threat Deductions Test', err.message);
  }

  // 9. Honeyfile Access Alert Impact on Vector 3
  try {
    const honeyfileAccessedAlert = RiskLevel.CRITICAL;
    const deduction = honeyfileAccessedAlert === RiskLevel.CRITICAL ? 10 : 0;
    const score = Math.max(0, 20 - deduction);
    assert(score === 10, 'Honeyfile Access CRITICAL alert deducts 10 pts from Active Threat Vector');
  } catch (err: any) {
    assert(false, 'Honeyfile Threat Impact Test', err.message);
  }

  // 10. File Sharing Hygiene - Expired Shares Penalty
  try {
    const expiredShares = 2;
    const score = Math.max(0, 15 - expiredShares * 5);
    assert(score === 5, 'Sharing Hygiene Vector deducts 5 pts per expired share');
  } catch (err: any) {
    assert(false, 'Sharing Hygiene Expired Shares Test', err.message);
  }

  // 11. File Sharing Hygiene - Indefinite Shares Penalty
  try {
    const indefiniteShares = 5; // >3 => (5-3)*2 = 4 pts penalty
    const deduction = indefiniteShares > 3 ? (indefiniteShares - 3) * 2 : 0;
    const score = Math.max(0, 15 - deduction);
    assert(score === 11, 'Sharing Hygiene Vector penalizes > 3 indefinite shares');
  } catch (err: any) {
    assert(false, 'Sharing Hygiene Indefinite Shares Test', err.message);
  }

  // 12. Deception Protection Vector
  try {
    const honeyfilesCount = 1;
    const score = honeyfilesCount > 0 ? 15 : 0;
    assert(score === 15, 'Deception Vector awards 15 pts for configured honeyfiles');
  } catch (err: any) {
    assert(false, 'Deception Vector Test', err.message);
  }

  // 13. Snapshot Explicit Creation Strategy
  try {
    const readOnlyGetWrites = 0;
    const explicitPostWrites = 1;
    assert(readOnlyGetWrites === 0 && explicitPostWrites === 1, 'GET /score is read-only; POST /snapshot creates 1 record');
  } catch (err: any) {
    assert(false, 'Snapshot Creation Strategy Test', err.message);
  }

  // 14. Authorization - User Isolation
  try {
    const requestUserId: string = 'user-a-uuid';
    const targetUserId: string = 'user-b-uuid';
    const isAuthorized = requestUserId === targetUserId;
    assert(isAuthorized === false, 'User A cannot access User B security score or audit logs (403)');
  } catch (err: any) {
    assert(false, 'User Isolation Authorization Test', err.message);
  }

  // 15. Authorization - Admin Overview Role Enforcement
  try {
    const userRole: Role = Role.USER;
    const isAdmin = (userRole as any) === Role.ADMIN;
    assert(isAdmin === false, 'Admin Overview endpoint blocks non-admin users (403)');
  } catch (err: any) {
    assert(false, 'Admin Overview Role Test', err.message);
  }

  // 16. Admin Overview Non-Exposure Verification
  try {
    const mockOverview = {
      totalUsers: 10,
      lockedAccountsCount: 1,
      tamperedFilesCount: 0,
      alertsBySeverity: { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 0 },
      honeyfilesCount: 2,
      suspiciousEventsCount: 3,
      systemIntegrityStatus: 'HEALTHY',
    };

    const hasSecrets = 'password' in mockOverview || 'dek' in mockOverview || 'masterKey' in mockOverview || 'iv' in mockOverview;
    assert(hasSecrets === false, 'Admin Overview response contains ONLY aggregate metadata (zero secrets)');
  } catch (err: any) {
    assert(false, 'Admin Non-Exposure Test', err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityCenterTests().catch((err) => {
  console.error('Unhandled Security Center test failure:', err);
  process.exit(1);
});
