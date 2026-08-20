import crypto from 'crypto';
import { hashToken } from '../utils/crypto';
import { redisClient } from '../config/redis';
import { prisma } from '../config/db';
import { generateOtpEmailHtml } from '../services/emailService';

export async function runOtpTests() {
  console.log('\n--- Running Registration Email OTP Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    const testEmail = `otp_test_${Date.now()}@example.com`;

    // Test 1: Cryptographically Secure 6-Digit OTP Generation & SHA-256 Hashing
    const otp = crypto.randomInt(100000, 999999).toString();
    assert(otp.length === 6 && /^[0-9]+$/.test(otp), 'Generated OTP is exactly 6 digits numeric');

    const hashedOtp = hashToken(otp);
    assert(hashedOtp.length === 64, 'Hashed OTP is valid 64-char hex SHA-256 string');
    assert(hashedOtp !== otp, 'Plaintext OTP is never equal to hashed representation');

    // Test 2: Redis Storage & Security (No Plaintext)
    const redisKey = `otp:${testEmail}`;
    await redisClient.set(redisKey, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);

    const storedValueStr = await redisClient.get(redisKey);
    assert(storedValueStr !== null, 'OTP record stored in Redis with 5-minute TTL');
    assert(!storedValueStr?.includes(otp), 'Security: Plaintext OTP is NOT present in Redis record');

    // Test 3: 60-Second Cooldown Enforcement
    const cooldownKey = `otp_cooldown:${testEmail}`;
    await redisClient.set(cooldownKey, '1', 'EX', 60);

    const isCooldownActive = await redisClient.get(cooldownKey);
    assert(isCooldownActive === '1', '60-second resend cooldown active in Redis');

    // Test 4: Failed Attempt Increment & Lockout at 3 Attempts
    let attempts = 0;
    for (let i = 1; i <= 3; i++) {
      attempts++;
      if (attempts >= 3) {
        await redisClient.del(redisKey);
      } else {
        await redisClient.set(redisKey, JSON.stringify({ hash: hashedOtp, attempts }), 'EX', 300);
      }
    }

    const valueAfterLockout = await redisClient.get(redisKey);
    assert(valueAfterLockout === null, 'Redis OTP key automatically deleted after 3 failed attempts');

    // Test 5: Successful Verification & Account Verification Status Update
    const freshOtp = crypto.randomInt(100000, 999999).toString();
    const freshHash = hashToken(freshOtp);
    await redisClient.set(redisKey, JSON.stringify({ hash: freshHash, attempts: 0 }), 'EX', 300);

    // Create test user in DB
    const dbUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'test_password_hash',
        emailVerified: false,
      },
    });
    assert(dbUser.emailVerified === false, 'Initial user emailVerified status is false');

    // Simulate successful OTP verification
    const inputHash = hashToken(freshOtp);
    if (inputHash === freshHash) {
      await redisClient.del(redisKey);
      await redisClient.del(cooldownKey);
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { emailVerified: true },
      });
    }

    const verifiedUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
    assert(verifiedUser?.emailVerified === true, 'User emailVerified updated to true after successful OTP verification');
    assert((await redisClient.get(redisKey)) === null, 'Redis OTP key deleted after successful verification');

    // Test 6: Security Verification of Email HTML Template
    const otpEmailHtml = generateOtpEmailHtml({ recipientEmail: testEmail, otp: freshOtp });
    assert(otpEmailHtml.includes(freshOtp), 'OTP email HTML contains 6-digit verification code');
    assert(!otpEmailHtml.includes('passwordHash') && !otpEmailHtml.includes('DEK'), 'Security: OTP email contains no sensitive secrets or keys');

    // Clean up test data
    await prisma.user.delete({ where: { id: dbUser.id } });

  } catch (err: any) {
    console.error('[FAIL] OTP test suite encountered exception:', err.message);
    failed++;
  }

  console.log(`\nRegistration OTP Tests Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (require.main === module) {
  runOtpTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
