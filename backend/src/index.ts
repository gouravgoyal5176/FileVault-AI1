import dotenv from 'dotenv';
import path from 'path';

// Load root .env file first, fallback to current working directory .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { validateEnv } from './config/envValidation';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { fileRouter } from './routes/files';
import { shareRouter } from './routes/shares';
import { threatRouter } from './routes/threats';
import { securityCenterRouter } from './routes/securityCenter';
import { initializeMinioBucket } from './config/minio';

// Validate environment variables on startup
validateEnv();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = Array.from(new Set([clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:80', 'http://localhost']));

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);

// CORS settings
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Parse JSON bodies, urlencoded data & cookies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Register API endpoints
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/files', fileRouter);
app.use('/api/shares', shareRouter);
app.use('/api/threats', threatRouter);
app.use('/api/security-center', securityCenterRouter);

// Default root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'FileVault API',
    subtitle: 'Zero-Trust Encrypted File Vault',
    status: 'online',
    healthCheck: '/api/health',
  });
});

// Centralized 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  try {
    initializeMinioBucket().catch((err) => {
      console.warn('MinIO auto-bucket initialization warning:', err.message);
    });

    app.listen(port, () => {
      console.log(`[FileVault API] Server running on port ${port} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
