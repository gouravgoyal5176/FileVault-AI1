import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { verifySmtpConnection, getSmtpSenderEmail } from '../config/smtp';
import { sendShareNotificationEmail } from '../services/emailService';
import { hashPassword } from '../utils/crypto';
import { shareFile, listFilesSharedWithUser } from '../services/fileService';

export async function runTwoRecipientSharingVerification() {
  console.log('\n================================================================');
  console.log('--- FILEVAULT AI — TWO REAL RECIPIENTS SHARING VERIFICATION ---');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ✗ ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // 1. Verify SMTP Connection via transporter.verify()
    const smtpCheck = await verifySmtpConnection();
    assert(smtpCheck.success, 'Nodemailer transporter.verify() succeeds for configured SMTP_USER', smtpCheck.error);

    const smtpSender = getSmtpSenderEmail();
    console.log(`Configured SMTP Sender: ${smtpSender}\n`);

    // 2. Setup Real Recipient Users & Owner User in PostgreSQL
    const recipient1Email = 'shantigoyal140@gmail.com';
    const recipient2Email = 'gouravgoyal77909@gmail.com';
    const ownerEmail = 'owner.test@filevault.local';
    const defaultPassword = 'Password123!';

    const pwdHash = await hashPassword(defaultPassword);

    // Upsert Recipient 1
    const user1 = await prisma.user.upsert({
      where: { email: recipient1Email.toLowerCase() },
      update: { emailVerified: true },
      create: { email: recipient1Email.toLowerCase(), passwordHash: pwdHash, emailVerified: true },
    });
    assert(user1.email === recipient1Email.toLowerCase(), `Recipient 1 Account Exists in PostgreSQL (${recipient1Email})`);

    // Upsert Recipient 2
    const user2 = await prisma.user.upsert({
      where: { email: recipient2Email.toLowerCase() },
      update: { emailVerified: true },
      create: { email: recipient2Email.toLowerCase(), passwordHash: pwdHash, emailVerified: true },
    });
    assert(user2.email === recipient2Email.toLowerCase(), `Recipient 2 Account Exists in PostgreSQL (${recipient2Email})`);

    // Upsert Owner User
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail.toLowerCase() },
      update: { emailVerified: true },
      create: { email: ownerEmail.toLowerCase(), passwordHash: pwdHash, emailVerified: true },
    });
    assert(owner.email === ownerEmail.toLowerCase(), `Owner Account Exists in PostgreSQL (${ownerEmail})`);

    // 3. Create File 1 and Share with Recipient 1 (VIEW Permission)
    const file1 = await prisma.file.create({
      data: {
        ownerId: owner.id,
        originalFilename: 'Quarterly_Report_Recipient1.pdf',
        storageKey: `test-key-1-${Date.now()}`,
        size: 1024,
        mimeType: 'application/pdf',
        sha256Hash: 'a'.repeat(64),
        iv: 'b'.repeat(32),
        authTag: 'c'.repeat(32),
        wrappedDek: 'd'.repeat(64),
        dekIv: 'e'.repeat(32),
        dekAuthTag: 'f'.repeat(32),
      },
    });

    const share1Result = await shareFile(
      file1.id,
      owner.id,
      recipient1Email,
      'VIEW',
      undefined,
      '127.0.0.1',
      'VerificationScript/1.0'
    );
    assert(share1Result.share.sharedWithId === user1.id, 'FileShare 1 Record Created in DB with Correct Recipient 1 ID');

    // 4. Create File 2 and Share with Recipient 2 (DOWNLOAD Permission)
    const file2 = await prisma.file.create({
      data: {
        ownerId: owner.id,
        originalFilename: 'Financial_Export_Recipient2.xlsx',
        storageKey: `test-key-2-${Date.now()}`,
        size: 2048,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sha256Hash: '1'.repeat(64),
        iv: '2'.repeat(32),
        authTag: '3'.repeat(32),
        wrappedDek: '4'.repeat(64),
        dekIv: '5'.repeat(32),
        dekAuthTag: '6'.repeat(32),
      },
    });

    const share2Result = await shareFile(
      file2.id,
      owner.id,
      recipient2Email,
      'DOWNLOAD',
      undefined,
      '127.0.0.1',
      'VerificationScript/1.0'
    );
    assert(share2Result.share.sharedWithId === user2.id, 'FileShare 2 Record Created in DB with Correct Recipient 2 ID');

    // 5. Verify Isolation in Shared With Me Queries
    const user1Shares = await listFilesSharedWithUser(user1.id, user1.email);
    const user2Shares = await listFilesSharedWithUser(user2.id, user2.email);

    const user1HasFile1 = user1Shares.some((s) => s.file.id === file1.id);
    const user1HasFile2 = user1Shares.some((s) => s.file.id === file2.id);
    const user2HasFile1 = user2Shares.some((s) => s.file.id === file1.id);
    const user2HasFile2 = user2Shares.some((s) => s.file.id === file2.id);

    assert(user1HasFile1 && !user1HasFile2, 'Shared With Me Isolation: Recipient 1 sees File 1 and NOT File 2');
    assert(user2HasFile2 && !user2HasFile1, 'Shared With Me Isolation: Recipient 2 sees File 2 and NOT File 1');

    // 6. Execute Real SMTP Dispatch for Recipient 1 (shantigoyal140@gmail.com)
    console.log('\n--- Executing Real SMTP Email Dispatch for Recipient 1 ---');
    const mail1Result = await sendShareNotificationEmail({
      recipientEmail: recipient1Email,
      sharedByEmail: smtpSender,
      originalFilename: file1.originalFilename,
      permission: 'VIEW',
    });

    console.log('[SHARE EMAIL]');
    console.log(`SMTP Sender: ${smtpSender}`);
    console.log(`Actual Recipient: ${recipient1Email}`);
    console.log(`Envelope From: ${smtpSender}`);
    console.log(`Envelope To: ${recipient1Email}`);
    console.log(`MessageId: ${mail1Result.messageId || 'N/A'}`);

    assert(mail1Result.success && !!mail1Result.messageId, 'SMTP Accepted Notification Email for Recipient 1 (shantigoyal140@gmail.com)');

    // 7. Execute Real SMTP Dispatch for Recipient 2 (gouravgoyal77909@gmail.com)
    console.log('\n--- Executing Real SMTP Email Dispatch for Recipient 2 ---');
    const mail2Result = await sendShareNotificationEmail({
      recipientEmail: recipient2Email,
      sharedByEmail: smtpSender,
      originalFilename: file2.originalFilename,
      permission: 'DOWNLOAD',
    });

    console.log('[SHARE EMAIL]');
    console.log(`SMTP Sender: ${smtpSender}`);
    console.log(`Actual Recipient: ${recipient2Email}`);
    console.log(`Envelope From: ${smtpSender}`);
    console.log(`Envelope To: ${recipient2Email}`);
    console.log(`MessageId: ${mail2Result.messageId || 'N/A'}`);

    assert(mail2Result.success && !!mail2Result.messageId, 'SMTP Accepted Notification Email for Recipient 2 (gouravgoyal77909@gmail.com)');

    // 8. Clean up created test files & share records
    await prisma.fileShare.deleteMany({ where: { id: { in: [share1Result.share.id, share2Result.share.id] } } });
    await prisma.file.deleteMany({ where: { id: { in: [file1.id, file2.id] } } });
    await prisma.user.delete({ where: { id: owner.id } });

  } catch (err: any) {
    console.error('[FAIL] Verification script encountered error:', err.message);
    failed++;
  }

  console.log(`\nTwo-Recipient Sharing Verification Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (require.main === module) {
  runTwoRecipientSharingVerification().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
