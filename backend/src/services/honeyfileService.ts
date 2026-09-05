import { prisma } from '../config/db';
import { RiskLevel } from '@prisma/client';

export async function triggerHoneyfileTrap(
  file: { id: string; originalFilename: string; ownerId: string },
  accessorId: string,
  ipAddress: string,
  userAgent: string
) {
  const description = `CRITICAL DECEPTION ALERT: Decoy honeyfile '${file.originalFilename}' (ID: ${file.id}) accessed by user ID ${accessorId} from IP address ${ipAddress}.`;

  // 1. Generate CRITICAL Security Alert for the user/intruder who accessed the honeyfile
  await prisma.securityAlert.create({
    data: {
      userId: accessorId,
      alertType: 'HONEYFILE_ACCESSED',
      riskLevel: RiskLevel.CRITICAL,
      description,
    },
  });

  // Also alert the file owner if different from accessor
  if (file.ownerId !== accessorId) {
    await prisma.securityAlert.create({
      data: {
        userId: file.ownerId,
        alertType: 'HONEYFILE_ACCESSED',
        riskLevel: RiskLevel.CRITICAL,
        description: `CRITICAL DECEPTION ALERT: Your decoy honeyfile '${file.originalFilename}' (ID: ${file.id}) was accessed by user ID ${accessorId} from IP address ${ipAddress}.`,
      },
    });
  }

  // 2. Log Activity Telemetry
  await prisma.activityLog.create({
    data: {
      userId: accessorId,
      actionType: 'HONEYFILE_ACCESSED',
      resourceId: file.id,
      ipAddress,
      userAgent,
      metadata: {
        filename: file.originalFilename,
        isHoneyfile: true,
        fileOwnerId: file.ownerId,
      },
    },
  });

  return { trapTriggered: true, description };
}
