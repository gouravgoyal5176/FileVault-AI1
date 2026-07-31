import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { getUserSecurityAlerts, getSecurityThreatSummary, evaluateBehavioralAnomaly } from '../services/threatService';

export const threatRouter = Router();

// Protect all threat routes with authentication
threatRouter.use(requireAuth);

// GET /api/threats/alerts
threatRouter.get('/alerts', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const alerts = await getUserSecurityAlerts(req.user.id);
    return res.status(200).json({ alerts });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve security alerts' });
  }
});

// GET /api/threats/summary
threatRouter.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const summary = await getSecurityThreatSummary(req.user.id);
    return res.status(200).json(summary);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve security threat summary' });
  }
});

// GET /api/threats/behavioral-summary
threatRouter.get('/behavioral-summary', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser';

    const behavioralResult = await evaluateBehavioralAnomaly(req.user.id, ipAddress, userAgent);
    return res.status(200).json(behavioralResult);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve behavioral anomaly summary' });
  }
});
