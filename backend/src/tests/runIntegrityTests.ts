import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { encryptEnvelope, decryptEnvelope, GcmAuthTagError, HashMismatchError } from '../utils/vaultCrypto';

async function runIntegrityTests() {
  console.log('\n==================================================');
  console.log('      FILEVAULT INTEGRITY VERIFICATION TESTS      ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureReason?: string) {
    if (condition) {
      console.log(`[PASS] ✓ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] 试点 ${testName} - ${failureReason || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Valid File Integrity Check
  try {
    const payload = Buffer.from('Valid file content for integrity check', 'utf8');
    const envelope = encryptEnvelope(payload);

    const decrypted = decryptEnvelope({
      ciphertext: envelope.ciphertext,
      iv: envelope.iv,
      authTag: envelope.authTag,
      wrappedDek: envelope.wrappedDek,
      dekIv: envelope.dekIv,
      dekAuthTag: envelope.dekAuthTag,
      expectedSha256Hash: envelope.sha256Hash,
    });

    assert(decrypted.toString('utf8') === payload.toString('utf8'), 'Healthy File Integrity Verification (GCM Auth Tag & SHA-256 Checksum)');
  } catch (err: any) {
    assert(false, 'Valid File Integrity Check', err.message);
  }

  // 2. Tampered File Detection Check
  try {
    const payload = Buffer.from('Valid file content prior to tamper simulation', 'utf8');
    const envelope = encryptEnvelope(payload);

    const corruptedCiphertext = Buffer.from(envelope.ciphertext);
    corruptedCiphertext[4] = corruptedCiphertext[4] ^ 0xaa;

    let caughtError = false;
    try {
      decryptEnvelope({
        ciphertext: corruptedCiphertext,
        iv: envelope.iv,
        authTag: envelope.authTag,
        wrappedDek: envelope.wrappedDek,
        dekIv: envelope.dekIv,
        dekAuthTag: envelope.dekAuthTag,
        expectedSha256Hash: envelope.sha256Hash,
      });
    } catch (err) {
      if (err instanceof GcmAuthTagError) {
        caughtError = true;
      }
    }

    assert(caughtError, 'Corrupted Ciphertext GCM Tag Failure triggers Tamper Signal');
  } catch (err: any) {
    assert(false, 'Tampered File Detection Check', err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIntegrityTests().catch((err) => {
  console.error('Unhandled integrity test failure:', err);
  process.exit(1);
});
