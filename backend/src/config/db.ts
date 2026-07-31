import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy' };
  } catch (error: any) {
    return { status: 'unhealthy', error: error?.message || 'Database connection failed' };
  }
}
