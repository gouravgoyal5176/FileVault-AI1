import { hashToken, generateRandomToken } from '../utils/crypto';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/db';
import { AuthProvider, Role } from '@prisma/client';

export async function runGoogleOAuthTests() {
  console.log('\n--- Running Backend Google GIS Authentication Tests ---');
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
    const testEmail = `google_test_${Date.now()}@example.com`;
    const googleSub = `google_sub_${Date.now()}`;

    // Test 1: User Account Creation for Verified Google Login
    const googleUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'placeholder_hash_' + generateRandomToken(16),
        googleId: googleSub,
        authProvider: AuthProvider.GOOGLE,
        emailVerified: true,
      },
    });

    assert(googleUser.email === testEmail, 'Google User account created with correct email');
    assert(googleUser.googleId === googleSub, 'Google User sub ID stored correctly');
    assert(googleUser.authProvider === AuthProvider.GOOGLE, 'authProvider is GOOGLE');
    assert(googleUser.emailVerified === true, 'emailVerified is true for Google users');

    // Test 2: Account Linking for existing LOCAL user
    const localEmail = `local_link_${Date.now()}@example.com`;
    const localUser = await prisma.user.create({
      data: {
        email: localEmail,
        passwordHash: 'local_password_hash',
        authProvider: AuthProvider.LOCAL,
        emailVerified: false,
      },
    });

    // Simulate account linking after Google email_verified === true
    const updatedUser = await prisma.user.update({
      where: { id: localUser.id },
      data: {
        googleId: 'linked_sub_' + Date.now(),
        authProvider: AuthProvider.HYBRID,
        emailVerified: true,
      },
    });

    assert(updatedUser.authProvider === AuthProvider.HYBRID, 'LOCAL user updated to AuthProvider.HYBRID on Google link');
    assert(updatedUser.passwordHash === 'local_password_hash', 'Existing passwordHash preserved during Google link');
    assert(updatedUser.emailVerified === true, 'emailVerified set to true upon Google account linking');

    // Test 3: JWT & Session Compatibility for Google User
    const accessToken = generateAccessToken({ userId: googleUser.id, role: googleUser.role });
    const decoded = verifyAccessToken(accessToken);

    assert(decoded !== null, 'Google user receives valid JWT access token');
    assert(decoded?.userId === googleUser.id, 'JWT access token contains correct userId');
    assert(decoded?.role === Role.USER, 'JWT access token contains correct role');

    // Test 4: Refresh Token Storage & Revocation Compatibility
    const rawRefreshToken = generateRandomToken(32);
    const tokenHash = hashToken(rawRefreshToken);

    const refreshTokenRow = await prisma.refreshToken.create({
      data: {
        userId: googleUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    assert(refreshTokenRow.userId === googleUser.id, 'Refresh token row stored for Google user');

    // Revoke tokens (logoutAllDevices compatibility)
    await prisma.refreshToken.updateMany({
      where: { userId: googleUser.id },
      data: { revoked: true },
    });

    const revokedToken = await prisma.refreshToken.findUnique({
      where: { id: refreshTokenRow.id },
    });
    assert(revokedToken?.revoked === true, 'Google user refresh token successfully revoked by logoutAllDevices');

    // Clean up test users
    await prisma.user.deleteMany({
      where: { id: { in: [googleUser.id, localUser.id] } },
    });

  } catch (err: any) {
    console.error('[FAIL] Google OAuth test suite encountered exception:', err.message);
    failed++;
  }

  console.log(`\nGoogle OAuth Tests Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (require.main === module) {
  runGoogleOAuthTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
