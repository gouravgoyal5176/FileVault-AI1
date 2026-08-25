import { prisma } from '../config/db';
import cloudinary, { CLOUDINARY_FOLDER } from '../config/cloudinary';
import {
  encryptEnvelope,
  decryptEnvelope,
  GcmAuthTagError,
  HashMismatchError,
} from '../utils/vaultCrypto';
import { IntegrityStatus, RiskLevel, Role, SharePermission } from '@prisma/client';
import crypto from 'crypto';
import { Readable } from 'stream';
import { trackDownloadSpike } from './threatService';
import { triggerHoneyfileTrap } from './honeyfileService';
import { sendShareNotificationEmail } from './emailService';

// Utility helper to convert MinIO stream to Buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}

export type RequiredAccessLevel = 'VIEW' | 'DOWNLOAD' | 'DELETE' | 'OWNER';

export interface AuthorizedAccessResult {
  file: any;
  share?: any;
  isOwner: boolean;
}

// Single Source of Truth for File Authorization
export async function authorizeFileAccess(
  fileId: string,
  userId: string,
  userRole: Role,
  requiredAccess: RequiredAccessLevel,
  userEmail?: string
): Promise<AuthorizedAccessResult> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { owner: true },
  });

  if (!file) {
    throw { statusCode: 404, message: 'File not found.' };
  }

  // Rule 9 Guarantee: Admin accounts can NEVER access or decrypt private user files
  if (userRole === Role.ADMIN && file.ownerId !== userId) {
    throw {
      statusCode: 403,
      message: 'Access denied. System policy strictly prohibits admin accounts from accessing or decrypting private user files.',
    };
  }

  // 1. File Owner access
  if (file.ownerId === userId) {
    return { file, isOwner: true };
  }

  // 2. Non-owner attempting OWNER or DELETE operations
  if (requiredAccess === 'OWNER' || requiredAccess === 'DELETE') {
    throw { statusCode: 403, message: 'Access denied. Only the file owner can perform this operation.' };
  }

  // 3. Share Recipient access check (robust ID or Email matching)
  const normalizedEmail = userEmail?.trim().toLowerCase();
  const shareRecipientConditions: any[] = [{ sharedWithId: userId }];
  if (normalizedEmail) {
    shareRecipientConditions.push({
      sharedWith: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });
  }

  const share = await prisma.fileShare.findFirst({
    where: {
      fileId: file.id,
      OR: shareRecipientConditions,
    },
  });

  if (!share) {
    throw { statusCode: 403, message: 'Access denied. You do not have permission to access this file.' };
  }

  // 4. Check Share Expiration
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw { statusCode: 403, message: 'Access denied. Share permission for this file has expired.' };
  }

  // 5. Check VIEW vs DOWNLOAD permission
  if (requiredAccess === 'DOWNLOAD' && share.permission !== SharePermission.DOWNLOAD) {
    throw {
      statusCode: 403,
      message: 'Access denied. This file was shared with VIEW-only permission. Download is prohibited.',
    };
  }

  return { file, share, isOwner: false };
}

export async function uploadFile(
  userId: string,
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
  isHoneyfile: boolean = false,
  ipAddress: string,
  userAgent: string
) {
  console.log(`[Upload Pipeline] Initiating upload: "${originalFilename}" (${fileBuffer.length} bytes, MIME: ${mimeType}) for user ${userId}`);

  // Enforce cumulative 2 GB storage quota per user
  const currentUsage = await prisma.file.aggregate({
    where: { ownerId: userId },
    _sum: { size: true },
  });
  const usedBytes = currentUsage._sum.size || 0;
  const MAX_QUOTA_BYTES = 2 * 1024 * 1024 * 1024; // 2.00 GB

  if (usedBytes + fileBuffer.length > MAX_QUOTA_BYTES) {
    throw {
      statusCode: 400,
      message: `Storage quota exceeded. Your current usage is ${(usedBytes / (1024 * 1024)).toFixed(1)} MB out of 2.00 GB limit.`,
    };
  }

  // Generate random UUID for storage key (Path Traversal Protection)
  const storageKey = crypto.randomUUID();

  // Encrypt plaintext file using AES-256-GCM envelope encryption
  const cryptoData = encryptEnvelope(fileBuffer);
  console.log(`[Upload Pipeline] AES-256-GCM envelope encryption complete. Ciphertext size: ${cryptoData.ciphertext.length} bytes`);

  // Upload ONLY ciphertext to MinIO
  try {
  await cloudinary.uploader.upload(
    `data:application/octet-stream;base64,${cryptoData.ciphertext.toString('base64')}`,
    {
      resource_type: 'raw',
      type: 'authenticated',
      public_id: storageKey,
      folder: CLOUDINARY_FOLDER,
      overwrite: false,
    }
  );

  console.log(
    `[Upload Pipeline] Ciphertext successfully uploaded to Cloudinary storage key "${storageKey}"`
  );
} catch (cloudinaryErr: any) {
  console.error(
    `[Upload Pipeline ERROR] Cloudinary upload failed for key "${storageKey}":`,
    cloudinaryErr.message
  );

  throw {
    statusCode: 500,
    message: `Storage failure: ${cloudinaryErr.message}`,
  };
}

  // Store metadata & encrypted DEK in PostgreSQL
  const fileRecord = await prisma.file.create({
    data: {
      ownerId: userId,
      originalFilename,
      storageKey,
      size: fileBuffer.length,
      mimeType,
      sha256Hash: cryptoData.sha256Hash,
      iv: cryptoData.iv,
      authTag: cryptoData.authTag,
      wrappedDek: cryptoData.wrappedDek,
      dekIv: cryptoData.dekIv,
      dekAuthTag: cryptoData.dekAuthTag,
      integrityStatus: IntegrityStatus.OK,
      isHoneyfile,
    },
  });
  console.log(`[Upload Pipeline] Database metadata record created successfully. File ID: ${fileRecord.id}`);

  // Log upload audit event
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'FILE_UPLOADED',
      resourceId: fileRecord.id,
      ipAddress,
      userAgent,
      metadata: {
        filename: originalFilename,
        size: fileBuffer.length,
        mimeType,
        isHoneyfile,
      },
    },
  });

  return {
    id: fileRecord.id,
    originalFilename: fileRecord.originalFilename,
    storageKey: fileRecord.storageKey,
    size: fileRecord.size,
    mimeType: fileRecord.mimeType,
    sha256Hash: fileRecord.sha256Hash,
    integrityStatus: fileRecord.integrityStatus,
    isHoneyfile: fileRecord.isHoneyfile,
    createdAt: fileRecord.createdAt,
  };
}

export async function downloadFile(
  fileId: string,
  userId: string,
  userRole: Role,
  ipAddress: string,
  userAgent: string,
  userEmail?: string
) {
  // Single Source of Truth Authorization
  const { file } = await authorizeFileAccess(fileId, userId, userRole, 'DOWNLOAD', userEmail);

  // Trigger Honeyfile Deception Trap if file is decoy honeyfile
  if (file.isHoneyfile) {
    try {
      await triggerHoneyfileTrap(file, userId, ipAddress, userAgent);
    } catch (err: any) {
      console.warn('Honeyfile trap trigger warning:', err.message);
    }
  }

  // Retrieve ciphertext from MinIO
  let ciphertextBuffer: Buffer;

try {
  const resource = await cloudinary.api.resource(
    `${CLOUDINARY_FOLDER}/${file.storageKey}`,
    {
      resource_type: 'raw',
      type: 'authenticated',
    }
  );

  const response = await fetch(resource.secure_url);

  if (!response.ok) {
    throw new Error(`Cloudinary returned HTTP ${response.status}`);
  }

  ciphertextBuffer = Buffer.from(await response.arrayBuffer());
} catch (err: any) {
  throw {
    statusCode: 500,
    message: 'Failed to retrieve file ciphertext from object storage.',
  };
}

  // Attempt decryption & integrity check
  let decryptedBuffer: Buffer;
  try {
    decryptedBuffer = decryptEnvelope({
      ciphertext: ciphertextBuffer,
      iv: file.iv,
      authTag: file.authTag,
      wrappedDek: file.wrappedDek,
      dekIv: file.dekIv,
      dekAuthTag: file.dekAuthTag,
      expectedSha256Hash: file.sha256Hash,
    });
  } catch (error: any) {
    if (error instanceof GcmAuthTagError || error instanceof HashMismatchError) {
      // Mark file TAMPERED
      await prisma.file.update({
        where: { id: file.id },
        data: { integrityStatus: IntegrityStatus.TAMPERED },
      });

      // Generate Critical Security Alert
      await prisma.securityAlert.create({
        data: {
          userId: file.ownerId,
          alertType: 'FILE_TAMPER_DETECTED',
          riskLevel: RiskLevel.CRITICAL,
          description: `Integrity check failed for file '${file.originalFilename}' (ID: ${file.id}). ${error.message}`,
        },
      });

      // Audit Log tamper detection
      await prisma.activityLog.create({
        data: {
          userId,
          actionType: 'FILE_TAMPER_DETECTED',
          resourceId: file.id,
          ipAddress,
          userAgent,
          metadata: { error: error.message },
        },
      });

      throw {
        statusCode: 400,
        message: 'FILE_TAMPERED: Integrity verification failed for this file. Access blocked for security.',
        integrityStatus: 'TAMPERED',
      };
    }

    throw { statusCode: 500, message: `Decryption error: ${error.message}` };
  }

  // Audit log download
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'FILE_DOWNLOADED',
      resourceId: file.id,
      ipAddress,
      userAgent,
    },
  });

  // Track bulk download volume spikes
  try {
    await trackDownloadSpike(userId, ipAddress, userAgent);
  } catch (err: any) {
    console.warn('Bulk download spike detection warning:', err.message);
  }

  return {
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    size: file.size,
    decryptedBuffer,
  };
}

export async function listUserFiles(userId: string, search?: string) {
  const whereClause: any = {
    ownerId: userId,
  };

  if (search && search.trim().length > 0) {
    whereClause.originalFilename = {
      contains: search.trim(),
      mode: 'insensitive',
    };
  }

  const files = await prisma.file.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      originalFilename: true,
      storageKey: true,
      size: true,
      mimeType: true,
      sha256Hash: true,
      integrityStatus: true,
      isHoneyfile: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return files;
}

export async function getFileDetails(
  fileId: string,
  userId: string,
  userRole: Role,
  ipAddress: string = '127.0.0.1',
  userAgent: string = 'Unknown',
  userEmail?: string
) {
  const { file } = await authorizeFileAccess(fileId, userId, userRole, 'VIEW', userEmail);

  // Trigger Honeyfile Deception Trap if file is decoy honeyfile
  if (file.isHoneyfile) {
    try {
      await triggerHoneyfileTrap(file, userId, ipAddress, userAgent);
    } catch (err: any) {
      console.warn('Honeyfile trap trigger warning:', err.message);
    }
  }

  return {
    id: file.id,
    originalFilename: file.originalFilename,
    storageKey: file.storageKey,
    size: file.size,
    mimeType: file.mimeType,
    sha256Hash: file.sha256Hash,
    encryptionAlgorithm: 'AES-256-GCM Envelope Encryption',
    keyWrappingAlgorithm: 'AES-256-GCM Master Key Encrypted DEK',
    ivConfigured: true,
    authTagConfigured: true,
    wrappedDekConfigured: true,
    integrityStatus: file.integrityStatus,
    isHoneyfile: file.isHoneyfile,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

export async function deleteFile(fileId: string, userId: string, ipAddress: string, userAgent: string) {
  const { file } = await authorizeFileAccess(fileId, userId, Role.USER, 'DELETE');

  // 1. Delete object from MinIO
  try {
  await cloudinary.uploader.destroy(
    `${CLOUDINARY_FOLDER}/${file.storageKey}`,
    {
      resource_type: 'raw',
      type: 'authenticated',
      invalidate: true,
    }
  );
} catch (err: any) {
  console.warn(
    `Cloudinary delete warning for key ${file.storageKey}:`,
    err.message
  );
}

  // 2. Delete database record
  await prisma.file.delete({
    where: { id: fileId },
  });

  // 3. Log audit action
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'FILE_DELETED',
      resourceId: fileId,
      ipAddress,
      userAgent,
      metadata: { filename: file.originalFilename },
    },
  });

  return { message: 'File deleted successfully.' };
}

export async function verifyFileIntegrity(
  fileId: string,
  userId: string,
  userRole: Role,
  ipAddress: string,
  userAgent: string
) {
  const { file } = await authorizeFileAccess(fileId, userId, userRole, 'VIEW');

  // Trigger Honeyfile Deception Trap if file is decoy honeyfile
  if (file.isHoneyfile) {
    try {
      await triggerHoneyfileTrap(file, userId, ipAddress, userAgent);
    } catch (err: any) {
      console.warn('Honeyfile trap trigger warning:', err.message);
    }
  }

  // Fetch ciphertext from MinIO
  let ciphertextBuffer: Buffer;

try {
  const resource = await cloudinary.api.resource(
    `${CLOUDINARY_FOLDER}/${file.storageKey}`,
    {
      resource_type: 'raw',
      type: 'authenticated',
    }
  );

  const response = await fetch(resource.secure_url);

  if (!response.ok) {
    throw new Error(`Cloudinary returned HTTP ${response.status}`);
  }

  ciphertextBuffer = Buffer.from(await response.arrayBuffer());
} catch (err: any) {
  throw {
    statusCode: 500,
    message: 'Failed to retrieve file ciphertext from storage.',
  };
}
  try {
    decryptEnvelope({
      ciphertext: ciphertextBuffer,
      iv: file.iv,
      authTag: file.authTag,
      wrappedDek: file.wrappedDek,
      dekIv: file.dekIv,
      dekAuthTag: file.dekAuthTag,
      expectedSha256Hash: file.sha256Hash,
    });

    if (file.integrityStatus !== IntegrityStatus.OK) {
      await prisma.file.update({
        where: { id: file.id },
        data: { integrityStatus: IntegrityStatus.OK },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId,
        actionType: 'FILE_INTEGRITY_VERIFIED',
        resourceId: file.id,
        ipAddress,
        userAgent,
        metadata: { status: 'OK' },
      },
    });

    return {
      id: file.id,
      originalFilename: file.originalFilename,
      integrityStatus: IntegrityStatus.OK,
      verified: true,
      message: 'GCM Authentication Tag and SHA-256 Checksum verified successfully.',
    };
  } catch (error: any) {
    if (error instanceof GcmAuthTagError || error instanceof HashMismatchError) {
      await prisma.file.update({
        where: { id: file.id },
        data: { integrityStatus: IntegrityStatus.TAMPERED },
      });

      await prisma.securityAlert.create({
        data: {
          userId: file.ownerId,
          alertType: 'FILE_TAMPER_DETECTED',
          riskLevel: RiskLevel.CRITICAL,
          description: `Integrity check failed for file '${file.originalFilename}' (ID: ${file.id}). ${error.message}`,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          actionType: 'FILE_TAMPER_DETECTED',
          resourceId: file.id,
          ipAddress,
          userAgent,
          metadata: { error: error.message },
        },
      });

      return {
        id: file.id,
        originalFilename: file.originalFilename,
        integrityStatus: IntegrityStatus.TAMPERED,
        verified: false,
        error: error.message,
      };
    }

    throw { statusCode: 500, message: `Verification failed: ${error.message}` };
  }
}

export async function verifyAllUserFiles(
  userId: string,
  userRole: Role,
  ipAddress: string,
  userAgent: string
) {
  const userFiles = await prisma.file.findMany({
    where: { ownerId: userId },
    select: { id: true, originalFilename: true },
  });

  const results = [];
  let okCount = 0;
  let tamperedCount = 0;

  for (const f of userFiles) {
    try {
      const res = await verifyFileIntegrity(f.id, userId, userRole, ipAddress, userAgent);
      results.push(res);
      if (res.integrityStatus === IntegrityStatus.OK) {
        okCount++;
      } else {
        tamperedCount++;
      }
    } catch (err: any) {
      results.push({
        id: f.id,
        originalFilename: f.originalFilename,
        integrityStatus: 'ERROR',
        verified: false,
        error: err.message,
      });
    }
  }

  return {
    totalFiles: userFiles.length,
    okCount,
    tamperedCount,
    results,
  };
}

// --- SECURE FILE SHARING SERVICES ---

export async function shareFile(
  fileId: string,
  ownerId: string,
  recipientEmail: string,
  permission: SharePermission,
  expiresAt: string | undefined,
  ipAddress: string,
  userAgent: string
) {
  // Verify ownership
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw { statusCode: 404, message: 'File not found.' };
  }

  if (file.ownerId !== ownerId) {
    throw { statusCode: 403, message: 'Only the file owner can grant sharing permissions.' };
  }

  // Resolve recipient using case-insensitive email lookup
  const targetEmail = recipientEmail.trim().toLowerCase();
  const recipient = await prisma.user.findFirst({
    where: {
      email: {
        equals: targetEmail,
        mode: 'insensitive',
      },
    },
  });

  if (!recipient) {
    throw { statusCode: 404, message: `Recipient user with email '${recipientEmail}' is not registered.` };
  }

  if (recipient.id === ownerId) {
    throw { statusCode: 400, message: 'Cannot share a file with yourself.' };
  }

  let parsedExpiresAt: Date | null = null;
  if (expiresAt) {
    parsedExpiresAt = new Date(expiresAt);
    if (isNaN(parsedExpiresAt.getTime())) {
      throw { statusCode: 400, message: 'Invalid expiration date format.' };
    }
    if (parsedExpiresAt <= new Date()) {
      throw { statusCode: 400, message: 'Expiration date must be in the future.' };
    }
  }

  // Upsert FileShare record (prevents duplicates, updates permission/expiry)
  const share = await prisma.fileShare.upsert({
    where: {
      fileId_sharedWithId: {
        fileId: file.id,
        sharedWithId: recipient.id,
      },
    },
    update: {
      permission,
      expiresAt: parsedExpiresAt,
      sharedById: ownerId,
    },
    create: {
      fileId: file.id,
      sharedById: ownerId,
      sharedWithId: recipient.id,
      permission,
      expiresAt: parsedExpiresAt,
    },
    include: {
      sharedWith: {
        select: { id: true, email: true },
      },
    },
  });

  // Audit Log
  await prisma.activityLog.create({
    data: {
      userId: ownerId,
      actionType: 'FILE_SHARED',
      resourceId: file.id,
      ipAddress,
      userAgent,
      metadata: {
        sharedWithEmail: recipient.email,
        permission,
        expiresAt: parsedExpiresAt,
      },
    },
  });

  // Fetch owner email for notification template
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { email: true },
  });

  // Dispatch notification email
  let emailSent = false;
  let emailError: string | undefined = undefined;

  try {
    const emailResult = await sendShareNotificationEmail({
      recipientEmail: recipient.email,
      sharedByEmail: owner?.email || 'A FileVault User',
      originalFilename: file.originalFilename,
      permission,
      expiresAt: parsedExpiresAt,
    });
    emailSent = emailResult.success;
    emailError = emailResult.error;
  } catch (err: any) {
    console.warn('Share notification email dispatch error:', err.message);
    emailError = err.message;
  }

  return {
    share,
    emailSent,
    emailError,
  };
}

export async function listFileShares(fileId: string, ownerId: string) {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
  });

  if (!file || file.ownerId !== ownerId) {
    throw { statusCode: 403, message: 'Access denied.' };
  }

  return prisma.fileShare.findMany({
    where: { fileId },
    include: {
      sharedWith: {
        select: { id: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listFilesSharedWithUser(userId: string, userEmail?: string) {
  const now = new Date();
  const normalizedEmail = userEmail?.trim().toLowerCase();

  const shareRecipientConditions: any[] = [{ sharedWithId: userId }];
  if (normalizedEmail) {
    shareRecipientConditions.push({
      sharedWith: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });
  }

  const activeShares = await prisma.fileShare.findMany({
    where: {
      OR: shareRecipientConditions,
      AND: [
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ],
    },
    include: {
      file: {
        select: {
          id: true,
          originalFilename: true,
          storageKey: true,
          size: true,
          mimeType: true,
          sha256Hash: true,
          integrityStatus: true,
          createdAt: true,
          owner: {
            select: { id: true, email: true },
          },
        },
      },
      sharedBy: {
        select: { id: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return activeShares.map((s) => ({
    shareId: s.id,
    permission: s.permission,
    expiresAt: s.expiresAt,
    sharedAt: s.createdAt,
    sharedByEmail: s.sharedBy.email,
    file: s.file,
  }));
}

export async function revokeShare(shareId: string, userId: string, ipAddress: string, userAgent: string) {
  const share = await prisma.fileShare.findUnique({
    where: { id: shareId },
    include: { file: true },
  });

  if (!share) {
    throw { statusCode: 404, message: 'Share permission not found.' };
  }

  if (share.sharedById !== userId && share.file.ownerId !== userId) {
    throw { statusCode: 403, message: 'Only the share granter or file owner can revoke this share.' };
  }

  await prisma.fileShare.delete({
    where: { id: shareId },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'FILE_SHARE_REVOKED',
      resourceId: share.fileId,
      ipAddress,
      userAgent,
      metadata: { shareId, revokedForId: share.sharedWithId },
    },
  });

  return { message: 'Share permission revoked successfully.' };
}
