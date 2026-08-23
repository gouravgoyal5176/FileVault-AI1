import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { prisma } from '../config/db';
import { redisClient } from '../config/redis';
import { Role, UserStatus } from '@prisma/client';
import crypto from 'crypto';
import http from 'http';

const API_BASE = 'http://localhost:5000/api';

function createMultipartBody(filename: string, fileBuffer: Buffer, boundary: string) {
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  return Buffer.concat([
    Buffer.from(header, 'utf8'),
    fileBuffer,
    Buffer.from(footer, 'utf8'),
  ]);
}

async function runRealWorldE2EVerification() {
  console.log('\n================================================================');
  console.log('       FILEVAULT AI — REAL-WORLD END-TO-END VERIFICATION       ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureDetails?: any) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${testName} - ${typeof failureDetails === 'object' ? JSON.stringify(failureDetails) : (failureDetails || 'Assertion failed')}`);
      failed++;
    }
  }

  function getCookieHeader(response: any): string {
    const rawCookie = response.headers.get('set-cookie');
    if (!rawCookie) return '';
    return rawCookie.split(';')[0];
  }

  try {
    // ----------------------------------------------------------------
    // SECTION 1: REGISTRATION -> DIRECT DASHBOARD
    // ----------------------------------------------------------------
    console.log('--- 1. Testing Registration -> Direct Dashboard ---');
    const testRegEmail = `e2e-reg-${Date.now()}@example.com`;
    const testRegPassword = 'Password123!';

    // Send OTP
    const sendOtpRes = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testRegEmail }),
    });
    assert(sendOtpRes.status === 200, 'Registration OTP Sent Successfully');

    // Retrieve OTP from Redis
    const recordStr = await redisClient.get(`otp:${testRegEmail.toLowerCase()}`);
    assert(recordStr !== null, 'Redis Registration OTP Key Found');

    // Test invalid OTP rejection
    const invalidRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testRegEmail, password: testRegPassword, otp: '000000' }),
    });
    const invalidRegData = await invalidRegRes.json();
    assert(invalidRegRes.status === 400, 'Invalid Registration OTP Correctly Rejected (400)', invalidRegData);

    // Seed known valid OTP for atomic registration testing
    const validOtpCode = '654321';
    const hashedOtp = crypto.createHash('sha256').update(validOtpCode).digest('hex');
    await redisClient.set(`otp:${testRegEmail.toLowerCase()}`, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);

    // Perform atomic registration
    const validRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testRegEmail, password: testRegPassword, otp: validOtpCode }),
    });

    const regData = (await validRegRes.json()) as any;
    const cookieHeader = getCookieHeader(validRegRes);

    assert(validRegRes.status === 201, 'Atomic Registration Response Code 201 Created', regData);
    assert(!!regData.accessToken, 'Registration Returns Valid Access Token');
    assert(regData.user?.email === testRegEmail.toLowerCase(), 'Registration User Email Matches Input');
    assert(regData.user?.emailVerified === true, 'Registration User emailVerified === true');
    assert(cookieHeader.includes('refreshToken='), 'HttpOnly Refresh Cookie Returned in Headers');

    // Test immediate authenticated API access
    const filesRes = await fetch(`${API_BASE}/files`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${regData.accessToken}` },
    });
    assert(filesRes.status === 200, 'Authenticated API Request Succeeds Immediately With Token');

    // Test refresh token session persistence
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    const refreshData = (await refreshRes.json()) as any;
    assert(refreshRes.status === 200 && !!refreshData.accessToken, 'Session Persistence via Refresh Cookie (200 OK)');


    // ----------------------------------------------------------------
    // SECTION 2: REAL FILE SHARING PIPELINE & AUTHORIZATION
    // ----------------------------------------------------------------
    console.log('\n--- 2. Testing Real File Sharing Pipeline (User A -> B & C) ---');
    const userAEmail = `owner-a-${Date.now()}@example.com`;
    const userBEmail = `view-b-${Date.now()}@example.com`;
    const userCEmail = `download-c-${Date.now()}@example.com`;
    const userDEmail = `unauthorized-d-${Date.now()}@example.com`;
    const password = 'Password123!';

    const { hashPassword } = require('../utils/crypto');
    const pwdHash = await hashPassword(password);

    const userA = await prisma.user.create({ data: { email: userAEmail.toLowerCase(), passwordHash: pwdHash, emailVerified: true } });
    const userB = await prisma.user.create({ data: { email: userBEmail.toUpperCase(), passwordHash: pwdHash, emailVerified: true } });
    const userC = await prisma.user.create({ data: { email: userCEmail.toLowerCase(), passwordHash: pwdHash, emailVerified: true } });
    const userD = await prisma.user.create({ data: { email: userDEmail.toLowerCase(), passwordHash: pwdHash, emailVerified: true } });

    const { generateAccessToken } = require('../utils/jwt');
    const tokenA = generateAccessToken({ userId: userA.id, role: userA.role });
    const tokenB = generateAccessToken({ userId: userB.id, role: userB.role });
    const tokenC = generateAccessToken({ userId: userC.id, role: userC.role });
    const tokenD = generateAccessToken({ userId: userD.id, role: userD.role });

    // Construct native multipart upload body
    const pdfBuffer = Buffer.from('%PDF-1.4 % Real World E2E Verification Test Document Payload %EOF');
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const multipartBody = createMultipartBody('CONFIDENTIAL_MODULE_3.pdf', pdfBuffer, boundary);

    const uploadRes = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody as any,
    });
    const uploadData = (await uploadRes.json()) as any;
    assert(uploadRes.status === 201 && !!uploadData.file?.id, 'User A Uploads Encrypted File Successfully');
    const fileId = uploadData.file.id;

    // User A shares file with User B (VIEW permission)
    const shareBRes = await fetch(`${API_BASE}/shares`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, recipientEmail: userBEmail.toLowerCase(), permission: 'VIEW' }),
    });
    assert(shareBRes.status === 201, 'User A Shares File With User B (VIEW Permission)');

    // User A shares file with User C (DOWNLOAD permission)
    const shareCRes = await fetch(`${API_BASE}/shares`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, recipientEmail: userCEmail, permission: 'DOWNLOAD' }),
    });
    assert(shareCRes.status === 201, 'User A Shares File With User C (DOWNLOAD Permission)');

    // User B checks Shared With Me
    const sharedWithBRes = await fetch(`${API_BASE}/shares/shared-with-me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const sharedWithBData = (await sharedWithBRes.json()) as any;
    assert(sharedWithBData.shares?.length === 1, 'User B Sees File in Shared With Me UI Endpoint');
    assert(sharedWithBData.shares[0]?.permission === 'VIEW', 'User B Permission is VIEW');

    // User B views file details -> Allowed
    const detailsBRes = await fetch(`${API_BASE}/files/${fileId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(detailsBRes.status === 200, 'User B Allowed to View File Details (200 OK)');

    // User B attempts payload download -> Blocked (403)
    const downloadBRes = await fetch(`${API_BASE}/files/${fileId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(downloadBRes.status === 403, 'User B Decrypted Payload Download Blocked (403 Forbidden)');

    // User C checks Shared With Me
    const sharedWithCRes = await fetch(`${API_BASE}/shares/shared-with-me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    const sharedWithCData = (await sharedWithCRes.json()) as any;
    assert(sharedWithCData.shares?.length === 1, 'User C Sees File in Shared With Me UI Endpoint');
    assert(sharedWithCData.shares[0]?.permission === 'DOWNLOAD', 'User C Permission is DOWNLOAD');

    // User C downloads file -> Allowed (200)
    const downloadCRes = await fetch(`${API_BASE}/files/${fileId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    const downloadedCArrayBuf = await downloadCRes.arrayBuffer();
    const downloadedCBuffer = Buffer.from(downloadedCArrayBuf);
    assert(downloadCRes.status === 200, 'User C Allowed to Download Decrypted Payload Stream (200 OK)');
    assert(downloadedCBuffer.toString() === pdfBuffer.toString(), 'User C Downloaded Payload Matches Original File Exactly');

    // User D checks Shared With Me -> 0 files
    const sharedWithDRes = await fetch(`${API_BASE}/shares/shared-with-me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    const sharedWithDData = (await sharedWithDRes.json()) as any;
    assert(sharedWithDData.shares?.length === 0, 'Unauthorized User D Sees 0 Shared Files');

    // User D attempts direct download -> 403 Forbidden
    const downloadDRes = await fetch(`${API_BASE}/files/${fileId}/download`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    assert(downloadDRes.status === 403, 'Unauthorized User D Direct Payload Access Blocked (403 Forbidden)');


    // ----------------------------------------------------------------
    // SECTION 3: DATABASE RECORDS INSPECTION
    // ----------------------------------------------------------------
    console.log('\n--- 3. Testing PostgreSQL Database Records ---');
    const shareRecords = await prisma.fileShare.findMany({ where: { fileId } });
    assert(shareRecords.length === 2, 'Database Contains Exactly 2 FileShare Records');

    const shareForB = shareRecords.find((s) => s.sharedWithId === userB.id);
    assert(!!shareForB, 'FileShare Record Contains Correct User B Database ID (sharedWithId)');

    const allUsers = await prisma.user.findMany({ select: { email: true } });
    const lowerEmails = allUsers.map((u) => u.email.toLowerCase());
    const hasDuplicates = lowerEmails.length !== new Set(lowerEmails).size;
    assert(hasDuplicates === false, 'Zero Case-Duplicate Email Records in PostgreSQL Database');


    // ----------------------------------------------------------------
    // SECTION 4: ADMIN DASHBOARD & USER MANAGEMENT OPERATIONS
    // ----------------------------------------------------------------
    console.log('\n--- 4. Testing Admin Dashboard & Account Management ---');
    const adminEmail = `admin-e2e-${Date.now()}@example.com`;
    const adminUser = await prisma.user.create({
      data: { email: adminEmail.toLowerCase(), passwordHash: pwdHash, emailVerified: true, role: Role.ADMIN },
    });
    const tokenAdmin = generateAccessToken({ userId: adminUser.id, role: adminUser.role });

    const nonAdminStatsRes = await fetch(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    assert(nonAdminStatsRes.status === 403, 'Non-Admin User Access to Admin Stats Blocked (403 Forbidden)');

    const adminStatsRes = await fetch(`${API_BASE}/admin/stats`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const statsData = (await adminStatsRes.json()) as any;
    assert(adminStatsRes.status === 200 && typeof statsData.totalUsers === 'number', 'Admin Fetch Stats Succeeds (200 OK)');

    const adminUsersRes = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const usersListData = (await adminUsersRes.json()) as any;
    assert(adminUsersRes.status === 200 && usersListData.users?.length >= 5, 'Admin Fetch Users List Succeeds (200 OK)');

    const suspendRes = await fetch(`${API_BASE}/admin/users/${userD.id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(suspendRes.status === 200, 'Admin Suspends User D (200 OK)');

    const suspendedUserDRes = await fetch(`${API_BASE}/files`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    assert(suspendedUserDRes.status === 403, 'Suspended User D API Access Blocked (403 Forbidden)');

    const activateRes = await fetch(`${API_BASE}/admin/users/${userD.id}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(activateRes.status === 200, 'Admin Activates User D (200 OK)');

    const activeUserDRes = await fetch(`${API_BASE}/files`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    assert(activeUserDRes.status === 200, 'Activated User D API Access Restored (200 OK)');

    const revokeRes = await fetch(`${API_BASE}/admin/users/${userD.id}/revoke-sessions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(revokeRes.status === 200, 'Admin Revokes Sessions for User D (200 OK)');

    const resetRes = await fetch(`${API_BASE}/admin/users/${userD.id}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(resetRes.status === 200, 'Admin Resets Account for User D (200 OK)');

    const deleteRes = await fetch(`${API_BASE}/admin/users/${userD.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(deleteRes.status === 200, 'Admin Deletes User D Account (200 OK)');

    const deletedUserDRes = await fetch(`${API_BASE}/files`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenD}` },
    });
    assert(deletedUserDRes.status === 401, 'Deleted User Token Rejected by Middleware (401 Unauthorized)');

    const reOtpCode = '654321';
    await redisClient.set(`otp:${userDEmail.toLowerCase()}`, JSON.stringify({ hash: hashedOtp, attempts: 0 }), 'EX', 300);
    const reRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userDEmail, password: 'NewPassword123!', otp: reOtpCode }),
    });
    const reRegData = (await reRegRes.json()) as any;
    assert(reRegRes.status === 201 && !!reRegData.accessToken, 'Deleted Email Re-registers Fresh Account Successfully (201 Created)');


    // ----------------------------------------------------------------
    // SECTION 5: SAFETY CHECKS
    // ----------------------------------------------------------------
    console.log('\n--- 5. Testing Admin Safety Protections ---');
    const selfSuspendRes = await fetch(`${API_BASE}/admin/users/${adminUser.id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(selfSuspendRes.status === 400, 'Admin Self-Suspension Attempt Blocked (400 Bad Request)');

    const selfDeleteRes = await fetch(`${API_BASE}/admin/users/${adminUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(selfDeleteRes.status === 400, 'Admin Self-Deletion Attempt Blocked (400 Bad Request)');

    // Clean up temporary test records
    await prisma.user.deleteMany({
      where: {
        id: { in: [userA.id, userB.id, userC.id, adminUser.id] },
      },
    });

  } catch (err: any) {
    console.error('Fatal E2E test execution error:', err);
    failed++;
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`REAL-WORLD E2E VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('----------------------------------------------------------------\n');
}

runRealWorldE2EVerification().catch(console.error);
