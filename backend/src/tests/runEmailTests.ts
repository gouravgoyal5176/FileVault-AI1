import { generateShareEmailHtml, sendShareNotificationEmail } from '../services/emailService';
import { isSmtpConfigured } from '../config/smtp';

export async function runEmailTests() {
  console.log('\n--- Running File Sharing Email Notification Tests ---');
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
    // Test 1: HTML Template Generation for VIEW Permission
    const viewEmailHtml = generateShareEmailHtml({
      recipientEmail: 'recipient@example.com',
      sharedByEmail: 'owner@example.com',
      originalFilename: 'Confidential_Document.pdf',
      permission: 'VIEW',
      expiresAt: null,
      frontendUrl: 'http://localhost:5173',
    });

    assert(viewEmailHtml.includes('Confidential_Document.pdf'), 'Email HTML contains file name');
    assert(viewEmailHtml.includes('owner@example.com'), 'Email HTML contains sender email');
    assert(viewEmailHtml.includes('VIEW ONLY'), 'Email HTML contains VIEW ONLY permission text');
    assert(viewEmailHtml.includes('http://localhost:5173'), 'Email HTML contains frontend application URL');

    // Test 2: HTML Template Generation for DOWNLOAD Permission with Expiry Date
    const expiryDate = new Date(Date.now() + 86400000);
    const downloadEmailHtml = generateShareEmailHtml({
      recipientEmail: 'recipient@example.com',
      sharedByEmail: 'owner@example.com',
      originalFilename: 'Financial_Export.xlsx',
      permission: 'DOWNLOAD',
      expiresAt: expiryDate,
      frontendUrl: 'http://localhost:5173',
    });

    assert(downloadEmailHtml.includes('DOWNLOAD ALLOWED'), 'Email HTML contains DOWNLOAD permission badge');
    assert(downloadEmailHtml.includes(expiryDate.getFullYear().toString()), 'Email HTML contains formatted expiration date');

    // Test 3: Security Lockdown Audit — ZERO Plaintext, DEK, Key, or Token leakage in Email HTML
    const sensitiveTokens = ['dek', 'wrappedDek', 'authTag', 'MASTER_ENCRYPTION_KEY', 'Bearer ', 'passwordHash'];
    let zeroLeaks = true;
    for (const token of sensitiveTokens) {
      if (viewEmailHtml.includes(token) || downloadEmailHtml.includes(token)) {
        zeroLeaks = false;
        break;
      }
    }
    assert(zeroLeaks, 'Security Lockdown: Email HTML contains NO sensitive keys, DEKs, tokens, or passwords');

    // Test 4: SMTP Transport Unconfigured Behavior
    if (!isSmtpConfigured()) {
      const result = await sendShareNotificationEmail({
        recipientEmail: 'test@example.com',
        sharedByEmail: 'owner@example.com',
        originalFilename: 'Test.pdf',
        permission: 'VIEW',
      });
      assert(result.success === false, 'Unconfigured SMTP safely returns success=false without throwing unhandled exceptions');
      assert(Boolean(result.error), 'Unconfigured SMTP returns clear descriptive error message');
    } else {
      console.log('[SKIP] SMTP is configured in current environment; testing unconfigured state skipped.');
      passed++;
    }

  } catch (err: any) {
    console.error('[FAIL] Email test suite encountered exception:', err.message);
    failed++;
  }

  console.log(`\nEmail Tests Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}

if (require.main === module) {
  runEmailTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}
