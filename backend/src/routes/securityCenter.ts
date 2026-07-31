import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';
import {
  calculateSecurityScore,
  saveScoreSnapshot,
  getAuditLogs,
  getAdminSecurityOverview,
} from '../services/securityCenterService';

export const securityCenterRouter = Router();

// Protect all Security Center routes with authentication
securityCenterRouter.use(requireAuth);

// GET /api/security-center/score (Read-only calculation, zero database writes)
securityCenterRouter.get('/score', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const scoreData = await calculateSecurityScore(req.user.id);
    return res.status(200).json(scoreData);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to calculate security score' });
  }
});

// POST /api/security-center/snapshot (Explicit single snapshot creation)
securityCenterRouter.post('/snapshot', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await saveScoreSnapshot(req.user.id);
    return res.status(201).json({
      message: 'Security score snapshot recorded successfully.',
      snapshot: result.snapshot,
      breakdown: result.breakdown,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to save score snapshot' });
  }
});

// GET /api/security-center/audit-logs (Scoped audit log explorer)
securityCenterRouter.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const actionType = req.query.actionType as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const auditData = await getAuditLogs(req.user.id, actionType, startDate, endDate, search, page, limit);
    return res.status(200).json(auditData);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// GET /api/security-center/admin/overview (ADMIN only aggregate metadata)
securityCenterRouter.get('/admin/overview', requireRole([Role.ADMIN]), async (_req: AuthRequest, res: Response) => {
  try {
    const overview = await getAdminSecurityOverview();
    return res.status(200).json(overview);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve admin security overview' });
  }
});
