import Redis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
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

export async function checkRedisHealth(): Promise<{ status: 'healthy' | 'unhealthy'; error?: string }> {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
    const pingResponse = await redisClient.ping();
    if (pingResponse === 'PONG') {
      return { status: 'healthy' };
    }
    return { status: 'unhealthy', error: `Unexpected ping response: ${pingResponse}` };
  } catch (error: any) {
    return { status: 'unhealthy', error: error?.message || 'Redis connection failed' };
  }
}
