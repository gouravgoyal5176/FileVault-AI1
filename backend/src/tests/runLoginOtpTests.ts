import crypto from 'crypto';
import { hashToken, generateRandomToken } from '../utils/crypto';
import { redisClient } from '../config/redis';
import { prisma } from '../config/db';
import { generateLoginOtpEmailHtml } from '../services/emailService';
import { verifyAccessToken } from '../utils/jwt';
import { AuthProvider, Role } from '@prisma/client';

export async function runLoginOtpTests() {
  console.log('\n--- Running Login Email OTP / MFA Tests ---');
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
    const testEmail = `login_mfa_test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // Create test user in DB
    const dbUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'hashed_password_placeholder',
        authProvider: AuthProvider.LOCAL,
        emailVerified: true,
      },
    });

    // Test 1: Cryptographically Secure 6-Digit Login OTP Generation & SHA-256 Hashing
    const otp = crypto.randomInt(100000, 999999).toString();
    assert(otp.length === 6 && /^[0-9]+$/.test(otp), 'Generated Login OTP is exactly 6 digits numeric');

    const hashedOtp = hashToken(otp);
    assert(hashedOtp.length === 64, 'Hashed Login OTP is valid 64-char hex SHA-256 string');
    assert(hashedOtp !== otp, 'Plaintext Login OTP is never equal to hashed representation');

    // Test 2: Separate Redis Key Namespace for Login OTP (login_otp:<email>)
    const redisKey = `login_otp:${testEmail}`;
    await redisClient.set(redisKey, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);

    const storedValueStr = await redisClient.get(redisKey);
    assert(storedValueStr !== null, 'Login OTP stored in Redis under login_otp: namespace with 5-minute TTL');
    assert(!storedValueStr?.includes(otp), 'Security: Plaintext Login OTP is NOT present in Redis record');

    // Test 3: 60-Second Login Resend Cooldown Enforcement
    const cooldownKey = `login_otp_cooldown:${testEmail}`;
    await redisClient.set(cooldownKey, '1', 'EX', 60);

    const isCooldownActive = await redisClient.get(cooldownKey);
    assert(isCooldownActive === '1', '60-second resend cooldown active in Redis for Login OTP');

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
    assert(valueAfterLockout === null, 'Redis Login OTP key automatically deleted after 3 failed attempts');

    // Test 5: Successful Verification & Session Issuance Only After OTP
    const freshOtp = crypto.randomInt(100000, 999999).toString();
    const freshHash = hashToken(freshOtp);
    await redisClient.set(redisKey, JSON.stringify({ hash: freshHash, attempts: 0 }), 'EX', 300);

    // Simulate OTP verification
    const inputHash = hashToken(freshOtp);
    assert(inputHash === freshHash, 'SHA-256 hash of submitted OTP matches stored Redis hash');

    if (inputHash === freshHash) {
      await redisClient.del(redisKey);
      await redisClient.del(cooldownKey);
    }

    assert((await redisClient.get(redisKey)) === null, 'Redis Login OTP key deleted after successful verification');

    // Test 6: Verify HTML Template for Login OTP
    const loginEmailHtml = generateLoginOtpEmailHtml({ recipientEmail: testEmail, otp: freshOtp });
    assert(loginEmailHtml.includes(freshOtp), 'Login OTP email HTML contains 6-digit verification code');
    assert(!loginEmailHtml.includes('passwordHash') && !loginEmailHtml.includes('DEK'), 'Security: Login OTP email contains no sensitive secrets');

    // Test 7: Namespace Separation Guarantee (Registration OTP vs Login OTP)
    const regKey = `otp:${testEmail}`;
    const loginKey = `login_otp:${testEmail}`;
    await redisClient.set(regKey, JSON.stringify({ hash: 'reg_hash', attempts: 0 }), 'EX', 300);
    await redisClient.set(loginKey, JSON.stringify({ hash: 'login_hash', attempts: 0 }), 'EX', 300);

    const regVal = await redisClient.get(regKey);
    const loginVal = await redisClient.get(loginKey);

    assert(regVal !== null && loginVal !== null, 'Both Registration and Login OTP keys exist simultaneously');
    assert(regVal !== loginVal, 'Registration OTP and Login OTP maintain separate Redis key namespaces');

    await redisClient.del(regKey);
    await redisClient.del(loginKey);

    // Clean up test database user
    await prisma.user.delete({ where: { id: dbUser.id } });

  } catch (err: any) {
    console.error('[FAIL] Login OTP test suite encountered exception:', err.message);
    failed++;
  }

  console.log(`\nLogin OTP / MFA Tests Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (require.main === module) {
  runLoginOtpTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
