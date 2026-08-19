import dotenv from 'dotenv';
import path from 'path';

// Load root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import { checkDatabaseHealth } from './config/db';
import { checkRedisHealth } from './config/redis';
import { checkMinioHealth } from './config/minio';

async function runFoundationCheck() {
  console.log('--- FILEVAULT PHASE 1 FOUNDATION VERIFICATION ---');
  
  const [db, redis, minio] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
    checkMinioHealth(),
  ]);

  console.log('Database Status:', JSON.stringify(db));
  console.log('Redis Status:', JSON.stringify(redis));
  console.log('MinIO Status:', JSON.stringify(minio));

  const allHealthy = db.status === 'healthy' && redis.status === 'healthy' && minio.status === 'healthy';
  console.log('Overall Foundation Health:', allHealthy ? 'HEALTHY (200 OK)' : 'UNHEALTHY (503 Service Unavailable)');
}

runFoundationCheck().catch((err) => {
  console.error('Foundation check error:', err);
});
