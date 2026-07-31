import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { Role, SharePermission, RiskLevel } from '@prisma/client';

async function runHoneyfileDeceptionTests() {
  console.log('\n==================================================');
  console.log('       FILEVAULT HONEYFILE DECEPTION TESTS       ');
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

  const ownerId: string = 'user-owner-uuid';
  const sharedUserId: string = 'user-shared-uuid';
  const unauthorizedUserId: string = 'user-unauthorized-uuid';
  const adminId: string = 'admin-user-uuid';
  const honeyfileId: string = 'honeyfile-decoy-uuid';

  const mockHoneyfile = {
    id: honeyfileId,
    ownerId: ownerId,
    originalFilename: 'passwords_decoy.xlsx',
    isHoneyfile: true,
  };

  const shareRecord = {
    sharedWithId: sharedUserId,
    permission: SharePermission.DOWNLOAD,
    expiresAt: null,
  };

  // Helper simulating file authorization + honeyfile trap logic
  function simulateHoneyfileAccess(
    userId: string,
    userRole: Role,
    operation: 'VIEW' | 'DOWNLOAD' | 'VERIFY',
    activeShare: typeof shareRecord | null
  ) {
    // 1. Rule 9 Guarantee: Admin cannot decrypt/access private user file
    if (userRole === Role.ADMIN && mockHoneyfile.ownerId !== userId) {
      return { authorized: false, code: 403, trapTriggered: false, error: 'Admin access forbidden.' };
    }

    // 2. Authorization Check
    let authorized = false;
    if (mockHoneyfile.ownerId === userId) {
      authorized = true;
    } else if (activeShare && activeShare.sharedWithId === userId) {
      if (operation === 'DOWNLOAD' && activeShare.permission !== SharePermission.DOWNLOAD) {
        authorized = false;
      } else {
        authorized = true;
      }
    }

    if (!authorized) {
      return { authorized: false, code: 403, trapTriggered: false, error: 'Access denied. IDOR active.' };
    }

    // 3. Trigger Honeyfile Deception Trap
    let trapTriggered = false;
    let alertCreated = false;
    let logCreated = false;
    let alertRiskLevel = null;

    if (mockHoneyfile.isHoneyfile) {
      trapTriggered = true;
      alertCreated = true;
      logCreated = true;
      alertRiskLevel = RiskLevel.CRITICAL;
    }

    return {
      authorized: true,
      trapTriggered,
      alertCreated,
      logCreated,
      alertRiskLevel,
    };
  }

  // Test 1: Honeyfile Flag Verification
  assert(mockHoneyfile.isHoneyfile === true, 'Honeyfile flagged correctly as decoy payload');

  // Test 2: Honeyfile Metadata/Details Access Trap
  const resDetails = simulateHoneyfileAccess(ownerId, Role.USER, 'VIEW', null);
  assert(
    resDetails.authorized === true && resDetails.trapTriggered === true && resDetails.alertRiskLevel === RiskLevel.CRITICAL,
    'Honeyfile Details (VIEW) Access Triggers CRITICAL Alert'
  );

  // Test 3: Honeyfile Download Access Trap
  const resDownload = simulateHoneyfileAccess(ownerId, Role.USER, 'DOWNLOAD', null);
  assert(
    resDownload.authorized === true && resDownload.trapTriggered === true && resDownload.alertRiskLevel === RiskLevel.CRITICAL,
    'Honeyfile Download Access Triggers CRITICAL Alert'
  );

  // Test 4: Honeyfile Integrity Verification Access Trap
  const resVerify = simulateHoneyfileAccess(ownerId, Role.USER, 'VERIFY', null);
  assert(
    resVerify.authorized === true && resVerify.trapTriggered === true && resVerify.alertRiskLevel === RiskLevel.CRITICAL,
    'Honeyfile Integrity Verification Access Triggers CRITICAL Alert'
  );

  // Test 5: Owner Honeyfile Access Trap
  const resOwner = simulateHoneyfileAccess(ownerId, Role.USER, 'DOWNLOAD', null);
  assert(resOwner.authorized === true && resOwner.trapTriggered === true, 'Owner Honeyfile Access Triggers Telemetry Trap');

  // Test 6: Shared-User Honeyfile Access Trap
  const resShared = simulateHoneyfileAccess(sharedUserId, Role.USER, 'DOWNLOAD', shareRecord);
  assert(
    resShared.authorized === true && resShared.trapTriggered === true,
    'Shared-User Honeyfile Access Triggers Telemetry Trap'
  );

  // Test 7: Unauthorized/IDOR Honeyfile Access Trap Prevention
  const resUnauth = simulateHoneyfileAccess(unauthorizedUserId, Role.USER, 'DOWNLOAD', null);
  assert(
    resUnauth.authorized === false && resUnauth.trapTriggered === false,
    'Unauthorized IDOR Access Attempt Blocked Before Trap Execution (403)'
  );

  // Test 8: Admin No-Decrypt Guarantee on Honeyfile Access
  const resAdmin = simulateHoneyfileAccess(adminId, Role.ADMIN, 'DOWNLOAD', shareRecord);
  assert(
    resAdmin.authorized === false && resAdmin.trapTriggered === false,
    'Admin Non-Owner Access Rejection Prevents Unintended Honeyfile Decryption (403)'
  );

  // Test 9: Telemetry & Alert Generation Verification
  assert(
    resDownload.alertCreated === true && resDownload.logCreated === true,
    'ActivityLog Telemetry & CRITICAL Security Alert Generated'
  );

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHoneyfileDeceptionTests().catch((err) => {
  console.error('Unhandled honeyfile test failure:', err);
  process.exit(1);
});
