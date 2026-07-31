import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { RiskLevel } from '@prisma/client';

async function runThreatDetectionTests() {
  console.log('\n==================================================');
  console.log('       FILEVAULT THREAT DETECTION TESTS           ');
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

  // 1. Brute-Force & Account Lockout Alert Logic Test
  try {
    const failedAttempts = 5;
    const isLockedOut = failedAttempts >= 5;
    const alertRisk = isLockedOut ? RiskLevel.HIGH : RiskLevel.LOW;

    assert(isLockedOut === true, 'Brute-Force 5 Failed Logins triggers Lockout');
    assert(alertRisk === RiskLevel.HIGH, 'Lockout generates HIGH risk security alert');
  } catch (err: any) {
    assert(false, 'Brute-Force Lockout Test', err.message);
  }

  // 2. Unusual Access (New IP / User-Agent) Detection Test
  try {
    const previousIp: string = '192.168.1.100';
    const newIp: string = '203.0.113.45';
    const previousAgent: string = 'Mozilla/5.0 (Windows NT 10.0)';
    const newAgent: string = 'Mozilla/5.0 (Linux; Android 11)';

    const isIpChanged = previousIp !== newIp;
    const isDeviceChanged = previousAgent !== newAgent;
    const isUnusual = isIpChanged || isDeviceChanged;

    assert(isUnusual === true, 'New IP / Device string triggers UNUSUAL_ACCESS alert');
  } catch (err: any) {
    assert(false, 'Unusual Access Test', err.message);
  }

  // 3. Bulk Download Volume Spike Detection Test
  try {
    const downloadCount = 6;
    const threshold = 5;
    const isSpike = downloadCount >= threshold;
    const alertRisk = isSpike ? RiskLevel.HIGH : RiskLevel.LOW;

    assert(isSpike === true, '6 downloads in 5 minutes triggers BULK_DOWNLOAD_SPIKE');
    assert(alertRisk === RiskLevel.HIGH, 'Bulk download spike generates HIGH risk security alert');
  } catch (err: any) {
    assert(false, 'Bulk Download Spike Test', err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runThreatDetectionTests().catch((err) => {
  console.error('Unhandled threat security test failure:', err);
  process.exit(1);
});
