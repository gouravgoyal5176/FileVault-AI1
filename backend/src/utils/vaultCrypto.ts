import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const DEK_LENGTH_BYTES = 32;

function getMasterKey(): Buffer {
  const masterKeyHex = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKeyHex || masterKeyHex.length !== 64) {
    throw new Error('MASTER_ENCRYPTION_KEY environment variable must be a valid 64-character hex string (32 bytes).');
  }
  return Buffer.from(masterKeyHex, 'hex');
}

export class GcmAuthTagError extends Error {
  constructor(message = 'GCM authentication tag verification failed. File ciphertext has been tampered with.') {
    super(message);
    this.name = 'GcmAuthTagError';
  }
}

export class HashMismatchError extends Error {
  constructor(message = 'SHA-256 checksum verification failed. Decrypted content does not match original upload hash.') {
    super(message);
    this.name = 'HashMismatchError';
  }
}

export function computeSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export interface EncryptedEnvelope {
  ciphertext: Buffer;
  iv: string;
  authTag: string;
  wrappedDek: string;
  dekIv: string;
  dekAuthTag: string;
  sha256Hash: string;
}

export function encryptEnvelope(plaintextBuffer: Buffer): EncryptedEnvelope {
  const masterKey = getMasterKey();

  // 1. Calculate SHA-256 hash of original plaintext
  const sha256Hash = computeSha256(plaintextBuffer);

  // 2. Generate random 32-byte Data Encryption Key (DEK)
  const dek = crypto.randomBytes(DEK_LENGTH_BYTES);

  // 3. Encrypt file plaintext with AES-256-GCM using DEK and fresh IV
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 4. Wrap (encrypt) DEK with AES-256-GCM using Master Key and separate IV
  const dekIv = crypto.randomBytes(IV_LENGTH_BYTES);
  const dekCipher = crypto.createCipheriv(ALGORITHM, masterKey, dekIv);
  const wrappedDek = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
  const dekAuthTag = dekCipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    wrappedDek: wrappedDek.toString('hex'),
    dekIv: dekIv.toString('hex'),
    dekAuthTag: dekAuthTag.toString('hex'),
    sha256Hash,
  };
}

export interface DecryptEnvelopeInput {
  ciphertext: Buffer;
  iv: string;
  authTag: string;
  wrappedDek: string;
  dekIv: string;
  dekAuthTag: string;
  expectedSha256Hash: string;
}

export function decryptEnvelope(input: DecryptEnvelopeInput): Buffer {
  const masterKey = getMasterKey();

  // 1. Unwrap DEK using Master Key
  let dek: Buffer;
  try {
    const dekDecipher = crypto.createDecipheriv(
      ALGORITHM,
      masterKey,
      Buffer.from(input.dekIv, 'hex')
    );
    dekDecipher.setAuthTag(Buffer.from(input.dekAuthTag, 'hex'));
    dek = Buffer.concat([
      dekDecipher.update(Buffer.from(input.wrappedDek, 'hex')),
      dekDecipher.final(),
    ]);
  } catch (error: any) {
    throw new GcmAuthTagError('Failed to unwrap DEK: Master key authentication tag mismatch.');
  }

  // 2. Decrypt file ciphertext using DEK
  let plaintextBuffer: Buffer;
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      dek,
      Buffer.from(input.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(input.authTag, 'hex'));
    plaintextBuffer = Buffer.concat([
      decipher.update(input.ciphertext),
      decipher.final(),
    ]);
  } catch (error: any) {
    throw new GcmAuthTagError('AES-256-GCM authentication tag verification failed. File ciphertext has been corrupted or tampered with.');
  }

  // 3. Verify recalculated SHA-256 against stored hash
  const recalculatedHash = computeSha256(plaintextBuffer);
  if (recalculatedHash !== input.expectedSha256Hash) {
    throw new HashMismatchError(`SHA-256 checksum mismatch. Recalculated: ${recalculatedHash}, Stored: ${input.expectedSha256Hash}`);
  }

  return plaintextBuffer;
}
