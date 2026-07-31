import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { hashPassword, verifyPassword, hashToken, generateRandomToken } from '../utils/crypto';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/authValidation';
import { Role } from '@prisma/client';

async function runAuthSecurityTests() {
  console.log('\n==================================================');
  console.log('       FILEVAULT AUTHENTICATION SECURITY TESTS     ');
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

  // 1. Password Hashing & Verification Test
  try {
    const rawPass = 'SecretPassword123!';
    const hashed = await hashPassword(rawPass);
    const isValid = await verifyPassword(rawPass, hashed);
    const isWrongValid = await verifyPassword('WrongPassword123!', hashed);

    assert(isValid === true, 'Password Verification with correct password');
    assert(isWrongValid === false, 'Password Verification rejection with wrong password');
    assert(!hashed.includes(rawPass), 'Password hash does not leak plaintext password');
  } catch (err: any) {
    assert(false, 'Password Hashing & Verification', err.message);
  }

  // 2. JWT Access Token Security Test
  try {
    const userId = 'test-user-uuid-1234';
    const role: Role = Role.USER;

    const token = generateAccessToken({ userId, role });
    const payload = verifyAccessToken(token);

    assert(payload !== null && payload.userId === userId && payload.role === Role.USER, 'JWT Token Sign & Verify');

    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    const tamperedPayload = verifyAccessToken(tamperedToken);
    assert(tamperedPayload === null, 'JWT Tamper Detection');
  } catch (err: any) {
    assert(false, 'JWT Access Token Security', err.message);
  }

  // 3. Refresh Token Hashing Test
  try {
    const rawToken = generateRandomToken(32);
    const hashedToken1 = hashToken(rawToken);
    const hashedToken2 = hashToken(rawToken);

    assert(hashedToken1 === hashedToken2, 'SHA-256 Refresh Token Hashing Determinism');
    assert(hashedToken1 !== rawToken, 'Raw Refresh Token is never stored directly');
    assert(rawToken.length === 64, 'Random token entropy length (32 bytes hex = 64 chars)');
  } catch (err: any) {
    assert(false, 'Refresh Token Hashing', err.message);
  }

  // 4. Zod Input Validation Tests
  try {
    const validRegister = registerSchema.safeParse({
      email: 'security.user@filevault.local',
      password: 'StrongP@ssword123',
    });
    assert(validRegister.success === true, 'Zod Registration Schema Valid Input');

    const invalidEmail = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'StrongP@ssword123',
    });
    assert(invalidEmail.success === false, 'Zod Registration Schema Invalid Email Rejection');

    const weakPassword = registerSchema.safeParse({
      email: 'user@filevault.local',
      password: 'weakpassword',
    });
    assert(weakPassword.success === false, 'Zod Registration Schema Weak Password Rejection');
  } catch (err: any) {
    assert(false, 'Zod Input Validation', err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthSecurityTests().catch((err) => {
  console.error('Unhandled security test runner failure:', err);
  process.exit(1);
});
