import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { Role, UserStatus, AuthProvider } from '@prisma/client';
import {
  getAdminStats,
  listAdminUsers,
  getAdminUserDetails,
  suspendUserAccount,
  activateUserAccount,
  revokeUserSessions,
  resetUserAccount,
  deleteUserAccount,
  getAdminAuditLogs,
  getAdminSecurityAlerts,
} from '../services/adminService';

export const adminRouter = Router();

// Apply auth and ADMIN role requirement to ALL admin routes
adminRouter.use(requireAuth, requireRole([Role.ADMIN]));

function getClientMeta(req: AuthRequest) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ipAddress, userAgent };
}

// GET /api/admin/stats (System overview statistics)
adminRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getAdminStats();
    return res.status(200).json(stats);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users (List and filter all registered users)
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const provider = req.query.provider as AuthProvider | undefined;
    const role = req.query.role as Role | undefined;
    const status = req.query.status as UserStatus | undefined;

    const users = await listAdminUsers({ search, provider, role, status });
    return res.status(200).json({ users });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to list users' });
  }
});

// GET /api/admin/users/:id (User details panel)
adminRouter.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const details = await getAdminUserDetails(req.params.id);
    return res.status(200).json(details);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to fetch user details' });
  }
});

// PATCH /api/admin/users/:id/suspend (Suspend user account)
adminRouter.patch('/users/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await suspendUserAccount(req.user!.id, req.params.id, ipAddress, userAgent);
    return res.status(200).json({ message: `User ${result.email} has been suspended.`, user: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to suspend user' });
  }
});

// PATCH /api/admin/users/:id/activate (Activate user account)
adminRouter.patch('/users/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await activateUserAccount(req.user!.id, req.params.id, ipAddress, userAgent);
    return res.status(200).json({ message: `User ${result.email} has been activated.`, user: result });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to activate user' });
  }
});

// POST /api/admin/users/:id/revoke-sessions (Revoke active user refresh tokens)
adminRouter.post('/users/:id/revoke-sessions', async (req: AuthRequest, res: Response) => {
  try {
    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await revokeUserSessions(req.user!.id, req.params.id, ipAddress, userAgent);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to revoke user sessions' });
  }
});

// POST /api/admin/users/:id/reset (Reset user account status & tokens)
adminRouter.post('/users/:id/reset', async (req: AuthRequest, res: Response) => {
  try {
    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await resetUserAccount(req.user!.id, req.params.id, ipAddress, userAgent);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to reset user account' });
  }
});

// DELETE /api/admin/users/:id (Permanently delete user account and associated data)
adminRouter.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await deleteUserAccount(req.user!.id, req.params.id, ipAddress, userAgent);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to delete user account' });
  }
});

// GET /api/admin/audit-logs (System-wide audit logs explorer)
adminRouter.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const actionType = req.query.actionType as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await getAdminAuditLogs({ search, actionType, page, limit });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch admin audit logs' });
  }
});

// GET /api/admin/security-alerts (System-wide security alerts list)
adminRouter.get('/security-alerts', async (req: AuthRequest, res: Response) => {
  try {
    const riskLevel = req.query.riskLevel as string | undefined;
    const resolvedStr = req.query.resolved as string | undefined;
    const resolved = resolvedStr === 'true' ? true : resolvedStr === 'false' ? false : undefined;

    const result = await getAdminSecurityAlerts({ riskLevel, resolved });
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch admin security alerts' });
  }
});

