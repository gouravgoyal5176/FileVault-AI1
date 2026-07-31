import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/db';
import { checkRedisHealth } from '../config/redis';
import { checkMinioHealth } from '../config/minio';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const [dbHealth, redisHealth, minioHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkMinioHealth(),
  ]);

  const allHealthy =
    dbHealth.status === 'healthy' &&
    redisHealth.status === 'healthy' &&
    minioHealth.status === 'healthy';

  const healthSummary = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
      redis: redisHealth,
      minio: minioHealth,
    },
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(healthSummary);
});
