import { Router, Response, Request } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { shareFileSchema } from '../validators/shareValidation';
import {
  shareFile,
  listFileShares,
  listFilesSharedWithUser,
  revokeShare,
} from '../services/fileService';

export const shareRouter = Router();

// Protect all share routes with authentication
shareRouter.use(requireAuth);

function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ipAddress, userAgent };
}

// POST /api/shares (Create or update file share)
shareRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parseResult = shareFileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { fileId, recipientEmail, permission, expiresAt } = parseResult.data;
    const { ipAddress, userAgent } = getClientMeta(req);

    const share = await shareFile(
      fileId,
      req.user.id,
      recipientEmail,
      permission,
      expiresAt || undefined,
      ipAddress,
      userAgent
    );

    return res.status(201).json({
      message: 'File shared successfully.',
      share,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to share file' });
  }
});

// GET /api/shares/file/:fileId (List shares for a specific file owned by user)
shareRouter.get('/file/:fileId', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const shares = await listFileShares(req.params.fileId, req.user.id);
    return res.status(200).json({ shares });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to list shares' });
  }
});

// GET /api/shares/shared-with-me (List files shared with authenticated user)
shareRouter.get('/shared-with-me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const shares = await listFilesSharedWithUser(req.user.id);
    return res.status(200).json({ shares });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to list shared files' });
  }
});

// DELETE /api/shares/:id (Revoke share permission)
shareRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await revokeShare(req.params.id, req.user.id, ipAddress, userAgent);

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to revoke share' });
  }
});
