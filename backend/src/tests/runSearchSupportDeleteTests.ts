import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('@postgres:')) {
  process.env.DATABASE_URL = 'postgresql://filevault_user:filevault_secure_password@localhost:5432/filevault?schema=public';
}

const { prisma } = require('../config/db');
import { Role, UserStatus, TicketCategory, TicketStatus } from '@prisma/client';
import { listAdminUsers } from '../services/adminService';
import { createSupportTicket, getUserSupportTickets, getAdminSupportTickets, updateSupportTicketStatus } from '../services/supportService';
import { deleteUserSelf } from '../services/userService';

async function runTests() {
  console.log('=== STARTING FILEVAULT AI SEARCH, SUPPORT & ACCOUNT DELETION TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  try {
    // 1. Setup Test Users
    const timestamp = Date.now();
    const adminEmail = `admin-test-${timestamp}@filevault-ai.org`;
    const userAEmail = `usera-search-${timestamp}@gmail.com`;
    const userBEmail = `userb-search-${timestamp}@yahoo.com`;

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: '$2b$10$e8w...dummyhash',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const userA = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash: '$2b$10$e8w...dummyhash',
        role: Role.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: userBEmail,
        passwordHash: '$2b$10$e8w...dummyhash',
        role: Role.USER,
        status: UserStatus.SUSPENDED,
        emailVerified: true,
      },
    });

    console.log(`Created test accounts: Admin (${admin.id}), UserA (${userA.id}), UserB (${userB.id})`);

    // --- TEST SUITE 1: ADMIN USER SEARCH & FILTERING ---
    console.log('\n--- SUITE 1: ADMIN SEARCH & FILTERS ---');

    // Test 1.1: Case-insensitive email search
    const searchEmailRes = await listAdminUsers({ search: 'usera-search' });
    assert(
      searchEmailRes.some((u) => u.id === userA.id),
      'Admin Search: Partial email case-insensitive match returns User A'
    );

    // Test 1.2: User ID search
    const searchIdRes = await listAdminUsers({ search: userB.id });
    assert(
      searchIdRes.some((u) => u.id === userB.id),
      'Admin Search: Exact User ID match returns User B'
    );

    // Test 1.3: Combined Search + Status Filter
    const searchCombinedRes = await listAdminUsers({
      search: 'search',
      status: UserStatus.SUSPENDED,
    });
    assert(
      searchCombinedRes.length === 1 && searchCombinedRes[0].id === userB.id,
      'Admin Search + Filter: Returns only SUSPENDED user matching search term'
    );

    // Test 1.4: Non-matching search returns empty array
    const emptySearchRes = await listAdminUsers({ search: 'nonexistent-xyz-99999' });
    assert(
      emptySearchRes.length === 0,
      'Admin Search: Non-matching term returns empty result set'
    );

    // --- TEST SUITE 2: SUPPORT CENTER & TICKETS ---
    console.log('\n--- SUITE 2: USER & ADMIN SUPPORT TICKETS ---');

    // Test 2.1: User A submits support ticket
    const ticket1 = await createSupportTicket(
      userA.id,
      'Need help with file encryption upload',
      TicketCategory.FILE_UPLOAD_PROBLEM,
      'My 15MB video file upload got interrupted halfway.',
      '127.0.0.1',
      'TestRunner/1.0'
    );
    assert(
      ticket1.userId === userA.id && ticket1.status === TicketStatus.OPEN,
      'Support Ticket: User A created support ticket successfully'
    );

    // Test 2.2: User A fetches own ticket history
    const userATickets = await getUserSupportTickets(userA.id);
    assert(
      userATickets.some((t) => t.id === ticket1.id),
      'Support Ticket: User A can view own ticket history'
    );

    // Test 2.3: User B cannot view User A's tickets (Isolating query by userId)
    const userBTickets = await getUserSupportTickets(userB.id);
    assert(
      !userBTickets.some((t) => t.id === ticket1.id),
      'Support Ticket Isolation: User B cannot view User A\'s ticket'
    );

    // Test 2.4: Admin views all support tickets
    const adminTicketsRes = await getAdminSupportTickets({ search: 'upload' });
    assert(
      adminTicketsRes.tickets.some((t) => t.id === ticket1.id),
      'Admin Support Management: Admin can search and list all support tickets'
    );

    // Test 2.5: Admin updates ticket status
    const updatedTicket = await updateSupportTicketStatus(
      admin.id,
      ticket1.id,
      TicketStatus.RESOLVED,
      '127.0.0.1',
      'TestRunner/1.0'
    );
    assert(
      updatedTicket.status === TicketStatus.RESOLVED,
      'Admin Support Management: Admin successfully updated ticket status to RESOLVED'
    );

    // --- TEST SUITE 3: USER ACCOUNT DELETION ---
    console.log('\n--- SUITE 3: USER ACCOUNT SELF-DELETION ---');

    // Test 3.1: User A deletes their own account
    const deleteResult = await deleteUserSelf(userA.id, '127.0.0.1', 'TestRunner/1.0');
    assert(
      deleteResult.message.includes('deleted successfully'),
      'User Self-Deletion: Account deletion completed cleanly'
    );

    // Test 3.2: Verify User A record is removed from database
    const deletedUserCheck = await prisma.user.findUnique({ where: { id: userA.id } });
    assert(
      deletedUserCheck === null,
      'User Self-Deletion: User A database record permanently purged'
    );

    // Test 3.3: Verify User A email is now available for fresh registration
    const reRegisterTest = await prisma.user.create({
      data: {
        email: userAEmail,
        passwordHash: '$2b$10$e8w...newhash',
        role: Role.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
    assert(
      reRegisterTest.email === userAEmail,
      'User Self-Deletion: Previously deleted email is available for fresh re-registration'
    );

    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        id: { in: [admin.id, userB.id, reRegisterTest.id] },
      },
    });

    console.log('\n=== TEST SUITE COMPLETE ===');
    console.log(`Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error: any) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runTests();
