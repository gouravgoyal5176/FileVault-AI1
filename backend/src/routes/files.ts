import { Router, Response, Request } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { FileSensitivity } from '@prisma/client';
import {
  uploadFile,
  downloadFile,
  viewFile,
  listUserFiles,
  getFileDetails,
  deleteFile,
  verifyFileIntegrity,
  verifyAllUserFiles,
  updateFileSensitivity,
} from '../services/fileService';
import { calculateUserRiskScore } from '../services/riskEngine';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size limit
  },
  fileFilter: (_req, _file, cb) => {
    cb(null, true);
  },
});

export const fileRouter = Router();

// Protect all file routes with authentication
fileRouter.use(requireAuth);

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ipAddress, userAgent };
}

// GET /api/files/risk-status (Current User Risk Score & Level)
fileRouter.get('/risk-status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const riskResult = await calculateUserRiskScore(req.user.id, ipAddress, userAgent);

    return res.status(200).json(riskResult);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to retrieve risk status' });
  }
});

// POST /api/files/verify-all (Batch Audit)
fileRouter.post('/verify-all', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const summary = await verifyAllUserFiles(req.user.id, req.user.role, ipAddress, userAgent);

    return res.status(200).json(summary);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Batch verification failed' });
  }
});

// POST /api/files/:id/verify (Single File Verification)
fileRouter.post('/:id/verify', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await verifyFileIntegrity(
      req.params.id,
      req.user.id,
      req.user.role,
      ipAddress,
      userAgent
    );

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Integrity verification failed' });
  }
});

// POST /api/files/upload
fileRouter.post(
  '/upload',
  (req: AuthRequest, res: Response, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File payload size exceeds maximum upload limit of 50MB.' });
          }
          return res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ error: err.message || 'File upload parsing failed.' });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided in upload request.' });
      }

      const isHoneyfile = req.body?.isHoneyfile === 'true' || req.body?.isHoneyfile === true;
      const sensitivityInput = (req.body?.sensitivity as string)?.toUpperCase();
      let sensitivity: FileSensitivity = FileSensitivity.INTERNAL;
      if (
        sensitivityInput &&
        ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'CRITICAL'].includes(sensitivityInput)
      ) {
        sensitivity = sensitivityInput as FileSensitivity;
      }

      const { ipAddress, userAgent } = getClientMeta(req);

      const result = await uploadFile(
        req.user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        isHoneyfile,
        sensitivity,
        ipAddress,
        userAgent
      );

      return res.status(201).json({
        message: 'File encrypted and stored successfully.',
        file: result,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ error: error.message || 'File upload failed' });
    }
  }
);

// PATCH /api/files/:id/sensitivity
fileRouter.patch('/:id/sensitivity', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sensitivity } = req.body;
    if (!sensitivity || !['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'CRITICAL'].includes(sensitivity)) {
      return res.status(400).json({ error: 'Invalid sensitivity level provided.' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const updatedFile = await updateFileSensitivity(
      req.params.id,
      req.user.id,
      sensitivity as FileSensitivity,
      ipAddress,
      userAgent
    );

    return res.status(200).json({ message: 'File sensitivity updated successfully.', file: updatedFile });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to update file sensitivity' });
  }
});

// GET /api/files (List & Search)
fileRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const search = req.query.search as string | undefined;
    const files = await listUserFiles(req.user.id, search);

    return res.status(200).json({ files });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to retrieve file list' });
  }
});

// GET /api/files/:id (Details)
fileRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const details = await getFileDetails(req.params.id, req.user.id, req.user.role, ipAddress, userAgent, req.user.email);
    return res.status(200).json({ file: details });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to retrieve file details' });
  }
});

// GET /api/files/:id/view (Decrypted Inline View Stream for In-App Viewer)
fileRouter.get('/:id/view', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stepUpMfaToken = req.headers['x-step-up-token'] as string | undefined;
    const { ipAddress, userAgent } = getClientMeta(req);
    const viewData = await viewFile(
      req.params.id,
      req.user.id,
      req.user.role,
      ipAddress,
      userAgent,
      req.user.email,
      stepUpMfaToken
    );

    res.setHeader('Content-Type', viewData.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(viewData.originalFilename)}"`
    );
    res.setHeader('Content-Length', viewData.decryptedBuffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.status(200).send(viewData.decryptedBuffer);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'File view failed',
      mfaRequired: error.mfaRequired || false,
      adaptiveDecision: error.adaptiveDecision,
      riskScore: error.riskScore,
      riskLevel: error.riskLevel,
      fileSensitivity: error.fileSensitivity,
      reasons: error.reasons,
      integrityStatus: error.integrityStatus,
    });
  }
});

// GET /api/files/:id/download (Decrypted Download Stream)
fileRouter.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const stepUpMfaToken = req.headers['x-step-up-token'] as string | undefined;
    const { ipAddress, userAgent } = getClientMeta(req);
    const downloadData = await downloadFile(
      req.params.id,
      req.user.id,
      req.user.role,
      ipAddress,
      userAgent,
      req.user.email,
      stepUpMfaToken
    );

    res.setHeader('Content-Type', downloadData.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(downloadData.originalFilename)}"`
    );
    res.setHeader('Content-Length', downloadData.decryptedBuffer.length);

    return res.status(200).send(downloadData.decryptedBuffer);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'File download failed',
      mfaRequired: error.mfaRequired || false,
      adaptiveDecision: error.adaptiveDecision,
      riskScore: error.riskScore,
      riskLevel: error.riskLevel,
      fileSensitivity: error.fileSensitivity,
      reasons: error.reasons,
      integrityStatus: error.integrityStatus,
    });
  }
});

// DELETE /api/files/:id
fileRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await deleteFile(req.params.id, req.user.id, ipAddress, userAgent);

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'File deletion failed' });
  }
});
