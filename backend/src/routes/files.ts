import { Router, Response, Request } from 'express';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import {
  uploadFile,
  downloadFile,
  listUserFiles,
  getFileDetails,
  deleteFile,
  verifyFileIntegrity,
  verifyAllUserFiles,
} from '../services/fileService';

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
      const { ipAddress, userAgent } = getClientMeta(req);

      const result = await uploadFile(
        req.user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        isHoneyfile,
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
    const details = await getFileDetails(req.params.id, req.user.id, req.user.role, ipAddress, userAgent);
    return res.status(200).json({ file: details });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to retrieve file details' });
  }
});

// GET /api/files/:id/download (Decrypted Download Stream)
fileRouter.get('/:id/download', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const downloadData = await downloadFile(
      req.params.id,
      req.user.id,
      req.user.role,
      ipAddress,
      userAgent
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
