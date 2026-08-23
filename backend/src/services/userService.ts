import { prisma } from '../config/db';
import { Role } from '@prisma/client';

export async function deleteUserSelf(userId: string, ipAddress: string, userAgent: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    throw { statusCode: 404, message: 'User account not found.' };
  }

  // Admin safeguard: prevent deletion of the last remaining admin account
  if (user.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
    if (adminCount <= 1) {
      throw { statusCode: 400, message: 'Cannot delete the last remaining administrator account.' };
    }
  }

  const userEmail = user.email;

  // Revoke all refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revoked: true },
  });

  // Log self-deletion event BEFORE user deletion so relation setNull handles history
  await prisma.activityLog.create({
    data: {
      userId,
      actionType: 'USER_DELETED_SELF',
      resourceId: userId,
      ipAddress,
      userAgent,
      metadata: { deletedEmail: userEmail },
    },
  });

  // Permanently delete user record. Prisma cascade rules will automatically clean up owned files, shares, refresh tokens, and support tickets.
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    message: 'Your FileVault AI account has been deleted successfully.',
  };
}
