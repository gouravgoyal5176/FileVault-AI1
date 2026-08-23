import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('@postgres:')) {
  process.env.DATABASE_URL = 'postgresql://filevault_user:filevault_secure_password@localhost:5432/filevault?schema=public';
}

const { prisma } = require('../config/db');
import { Role, UserStatus } from '@prisma/client';
import { adminLoginUser, loginUser, registerUser } from '../services/authService';
import {
  getAdminStats,
  listAdminUsers,
  getAdminUserDetails,
  suspendUserAccount,
  activateUserAccount,
  revokeUserSessions,
  resetUserAccount,
  deleteUserAccount,
  getAdminAuditLogs,
  getAdminSecurityAlerts,
} from '../services/adminService';

async function runAdminSecurityTests() {
  console.log('\n==================================================');
  console.log('    FILEVAULT REAL ADMIN SYSTEM & SECURITY TESTS  ');
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

  const mockRes: any = {
    cookie: () => {},
    clearCookie: () => {},
  };

  try {
    // ----------------------------------------------------
    // 1. Dedicated Admin Authentication (No OTP)
    // ----------------------------------------------------
    console.log('--- 1. Dedicated Admin Authentication (No OTP) ---');
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@filevault.ai').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminVault2026!';

    const adminAuthResult = await adminLoginUser(
      { email: adminEmail, password: adminPassword },
      mockRes,
      '127.0.0.1',
      'AdminTestAgent/1.0'
    );

    assert(!!adminAuthResult.accessToken, 'Admin Login Returns Access Token');
    assert(adminAuthResult.user.role === Role.ADMIN, 'Admin Login User Role is ADMIN');
    assert(adminAuthResult.user.email === adminEmail, 'Admin Email Matches Input');
    assert((adminAuthResult as any).requiresOtp === undefined, 'Admin Login Does NOT Request OTP');

    // 2. Wrong password for Admin Login
    let wrongPassFailed = false;
    try {
      await adminLoginUser(
        { email: adminEmail, password: 'WrongPassword123!' },
        mockRes,
        '127.0.0.1',
        'AdminTestAgent/1.0'
      );
    } catch (err: any) {
      wrongPassFailed = err.statusCode === 401;
    }
    assert(wrongPassFailed, 'Admin Login with Wrong Password Fails (401 Unauthorized)');

    // 3. Normal User created for Role Enforcement Testing
    console.log('\n--- 2. Normal User Creation & Role Enforcement ---');
    const normalUserEmail = `normal-user-${Date.now()}@example.com`;
    const normalUserPass = 'NormalUserPass123!';

    const normalUserReg = await registerUser(
      { email: normalUserEmail, password: normalUserPass },
      mockRes,
      '127.0.0.1',
      'UserAgent/1.0'
    );

    assert(normalUserReg.user.role === Role.USER, 'Normal User Registered with Role USER');

    // Non-admin account calling adminLoginUser
    let nonAdminLoginFailed = false;
    try {
      await adminLoginUser(
        { email: normalUserEmail, password: normalUserPass },
        mockRes,
        '127.0.0.1',
        'UserAgent/1.0'
      );
    } catch (err: any) {
      nonAdminLoginFailed = err.statusCode === 403;
    }
    assert(nonAdminLoginFailed, 'Normal User Attempting Admin Login Fails (403 Forbidden)');

    // ----------------------------------------------------
    // 3. System Statistics & Queries
    // ----------------------------------------------------
    console.log('\n--- 3. Admin Overview Stats & System Queries ---');
    const stats = await getAdminStats();
    assert(stats.totalUsers > 0, 'Admin Stats Returns Real Database User Count');
    assert(typeof stats.activeUsers === 'number', 'Admin Stats Active Users Count Present');
    assert(typeof stats.totalFiles === 'number', 'Admin Stats Total Files Count Present');

    const userList = await listAdminUsers({ search: normalUserEmail });
    assert(userList.length === 1 && userList[0].email === normalUserEmail, 'Admin List Users Search Returns Target Account');

    const userDetails = await getAdminUserDetails(normalUserReg.user.id);
    assert(userDetails.user.id === normalUserReg.user.id, 'Admin User Details Panel Returns Accurate User');
    assert((userDetails.user as any).passwordHash === undefined, 'User Details Does NOT Expose Password Hash');

    const auditLogs = await getAdminAuditLogs({ limit: 10 });
    assert(Array.isArray(auditLogs.logs), 'System-wide Admin Audit Logs Available');

    const securityAlerts = await getAdminSecurityAlerts({});
    assert(Array.isArray(securityAlerts.alerts), 'System-wide Security Alerts Available');

    // ----------------------------------------------------
    // 4. Account Lifecycle Management
    // ----------------------------------------------------
    console.log('\n--- 4. User Account Lifecycle (Suspend, Activate, Reset, Delete) ---');
    const adminUserRecord = await prisma.user.findUnique({ where: { email: adminEmail } });
    const adminId = adminUserRecord!.id;
    const targetUserId = normalUserReg.user.id;

    // Suspend user
    const suspended = await suspendUserAccount(adminId, targetUserId, '127.0.0.1', 'AdminAgent/1.0');
    assert(suspended.status === UserStatus.SUSPENDED, 'User Status Changed to SUSPENDED');

    // Suspended login check
    let suspendedLoginBlocked = false;
    try {
      await loginUser({ email: normalUserEmail, password: normalUserPass }, mockRes, '127.0.0.1', 'UserAgent/1.0');
    } catch (err: any) {
      suspendedLoginBlocked = err.statusCode === 403;
    }
    assert(suspendedLoginBlocked, 'Suspended User Login Blocked (403 Forbidden)');

    // Activate user
    const activated = await activateUserAccount(adminId, targetUserId, '127.0.0.1', 'AdminAgent/1.0');
    assert(activated.status === UserStatus.ACTIVE, 'User Status Restored to ACTIVE');

    // Revoke sessions
    const revokeRes = await revokeUserSessions(adminId, targetUserId, '127.0.0.1', 'AdminAgent/1.0');
    assert(!!revokeRes.message, 'User Active Sessions & Refresh Tokens Revoked');

    // Reset account
    const resetRes = await resetUserAccount(adminId, targetUserId, '127.0.0.1', 'AdminAgent/1.0');
    assert(!!resetRes.message, 'User Account Failed Login Counter & Lockout Reset');

    // Permanent Delete
    const deleteRes = await deleteUserAccount(adminId, targetUserId, '127.0.0.1', 'AdminAgent/1.0');
    assert(!!deleteRes.message, 'User Account Permanently Deleted');

    const deletedUserCheck = await prisma.user.findUnique({ where: { id: targetUserId } });
    assert(deletedUserCheck === null, 'Deleted User Record Completely Removed from Database');

    // Re-registration of deleted email
    const reReg = await registerUser(
      { email: normalUserEmail, password: normalUserPass },
      mockRes,
      '127.0.0.1',
      'UserAgent/1.0'
    );
    assert(reReg.user.email === normalUserEmail, 'Deleted Email Successfully Re-Registered for Fresh Account');

    // Clean up re-registered test user
    await prisma.user.delete({ where: { id: reReg.user.id } });

    // ----------------------------------------------------
    // 5. Admin Self-Protection & Guardrails
    // ----------------------------------------------------
    console.log('\n--- 5. Admin Self-Protection Safeguards ---');

    let selfSuspendBlocked = false;
    try {
      await suspendUserAccount(adminId, adminId, '127.0.0.1', 'AdminAgent/1.0');
    } catch (err: any) {
      selfSuspendBlocked = err.statusCode === 400;
    }
    assert(selfSuspendBlocked, 'Admin Self-Suspension Blocked (400 Bad Request)');

    let selfDeleteBlocked = false;
    try {
      await deleteUserAccount(adminId, adminId, '127.0.0.1', 'AdminAgent/1.0');
    } catch (err: any) {
      selfDeleteBlocked = err.statusCode === 400;
    }
    assert(selfDeleteBlocked, 'Admin Self-Deletion Blocked (400 Bad Request)');

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminSecurityTests().catch(console.error);
