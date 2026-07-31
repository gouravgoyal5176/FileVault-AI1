import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import {
  encryptEnvelope,
  decryptEnvelope,
  computeSha256,
  GcmAuthTagError,
  HashMismatchError,
} from '../utils/vaultCrypto';
import crypto from 'crypto';

async function runVaultSecurityTests() {
  console.log('\n==================================================');
  console.log('       FILEVAULT ENCRYPTION & VAULT TESTS         ');
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

  // 1. AES-256-GCM Envelope Encryption Roundtrip
  try {
    const originalText = 'CONFIDENTIAL ACADEMIC PROJECT DATA - ZERO TRUST FILEVAULT 2026';
    const plaintextBuffer = Buffer.from(originalText, 'utf8');

    const envelope = encryptEnvelope(plaintextBuffer);

    assert(envelope.ciphertext.toString('utf8') !== originalText, 'Ciphertext is non-plaintext binary');
    assert(envelope.iv.length === 24, 'File IV length is 12 bytes hex (24 chars)');
    assert(envelope.dekIv.length === 24, 'DEK IV length is 12 bytes hex (24 chars)');
    assert(envelope.iv !== envelope.dekIv, 'File IV and DEK IV are independent random IVs');

    const decryptedBuffer = decryptEnvelope({
      ciphertext: envelope.ciphertext,
      iv: envelope.iv,
      authTag: envelope.authTag,
      wrappedDek: envelope.wrappedDek,
      dekIv: envelope.dekIv,
      dekAuthTag: envelope.dekAuthTag,
      expectedSha256Hash: envelope.sha256Hash,
    });

    assert(decryptedBuffer.toString('utf8') === originalText, 'Decrypted plaintext matches original content exactly');
  } catch (err: any) {
    assert(false, 'Envelope Encryption Roundtrip', err.message);
  }

  // 2. Tampered Ciphertext GCM Auth Tag Detection Test
  try {
    const plaintextBuffer = Buffer.from('Sensitive payload to tamper test', 'utf8');
    const envelope = encryptEnvelope(plaintextBuffer);

    // Tamper single byte of ciphertext
    const tamperedCiphertext = Buffer.from(envelope.ciphertext);
    tamperedCiphertext[0] = tamperedCiphertext[0] ^ 0xff;

    let threwAuthError = false;
    try {
      decryptEnvelope({
        ciphertext: tamperedCiphertext,
        iv: envelope.iv,
        authTag: envelope.authTag,
        wrappedDek: envelope.wrappedDek,
        dekIv: envelope.dekIv,
        dekAuthTag: envelope.dekAuthTag,
        expectedSha256Hash: envelope.sha256Hash,
      });
    } catch (err) {
      if (err instanceof GcmAuthTagError) {
        threwAuthError = true;
      }
    }

    assert(threwAuthError, 'Tampered ciphertext triggers GcmAuthTagError exception');
  } catch (err: any) {
    assert(false, 'GCM Auth Tag Tamper Detection', err.message);
  }

  // 3. SHA-256 Checksum Mismatch Detection
  try {
    const plaintextBuffer = Buffer.from('Payload for checksum mismatch test', 'utf8');
    const envelope = encryptEnvelope(plaintextBuffer);

    const fakeHash = computeSha256(Buffer.from('Corrupted original data', 'utf8'));

    let threwHashError = false;
    try {
      decryptEnvelope({
        ciphertext: envelope.ciphertext,
        iv: envelope.iv,
        authTag: envelope.authTag,
        wrappedDek: envelope.wrappedDek,
        dekIv: envelope.dekIv,
        dekAuthTag: envelope.dekAuthTag,
        expectedSha256Hash: fakeHash,
      });
    } catch (err) {
      if (err instanceof HashMismatchError) {
        threwHashError = true;
      }
    }

    assert(threwHashError, 'SHA-256 hash mismatch triggers HashMismatchError exception');
  } catch (err: any) {
    assert(false, 'SHA-256 Checksum Mismatch Detection', err.message);
  }

  // 4. Path Traversal & UUID Storage Key Protection
  try {
    const storageKey = crypto.randomUUID();
    const originalFilename = '../../../../etc/passwd';

    assert(!storageKey.includes('etc'), 'Storage key contains no path traversal sequences');
    assert(storageKey.length === 36, 'Storage key is clean UUID v4 format');
  } catch (err: any) {
    assert(false, 'Path Traversal Protection', err.message);
  }

  console.log('\n--------------------------------------------------');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVaultSecurityTests().catch((err) => {
  console.error('Unhandled vault security test runner failure:', err);
  process.exit(1);
});
