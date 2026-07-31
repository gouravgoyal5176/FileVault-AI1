import * as Minio from 'minio';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000', 10);
const minioUseSSL = process.env.MINIO_USE_SSL === 'true';
const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'filevault-vault';

export const minioClient = new Minio.Client({
  endPoint: minioEndpoint,
  port: minioPort,
  useSSL: minioUseSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

export async function initializeMinioBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
    console.log(`MinIO bucket '${BUCKET_NAME}' created successfully.`);
  }
}

export async function checkMinioHealth(): Promise<{ status: 'healthy' | 'unhealthy'; bucketExists: boolean; error?: string }> {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await initializeMinioBucket();
    }
    return { status: 'healthy', bucketExists: true };
  } catch (error: any) {
    return { status: 'unhealthy', bucketExists: false, error: error?.message || 'MinIO connection failed' };
  }
}
