import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/db';
import { checkRedisHealth } from '../config/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const allHealthy =
    dbHealth.status === 'healthy' &&
    redisHealth.status === 'healthy';

  const healthSummary = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealth,
      redis: redisHealth,
    },
  };

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(healthSummary);
});