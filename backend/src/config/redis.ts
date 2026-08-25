import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

export const redisClient = redisUrl
  ? new Redis(redisUrl, {
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    })
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

redisClient.on('error', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Redis client error:', err.message);
  }
});

export async function checkRedisHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  error?: string;
}> {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }

    const pingResponse = await redisClient.ping();

    if (pingResponse === 'PONG') {
      return { status: 'healthy' };
    }

    return {
      status: 'unhealthy',
      error: `Unexpected ping response: ${pingResponse}`,
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error?.message || 'Redis connection failed',
    };
  }
}