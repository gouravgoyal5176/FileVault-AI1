import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { TicketCategory, TicketStatus, Role } from '@prisma/client';
import {
  createSupportTicket,
  getUserSupportTickets,
  getAdminSupportTickets,
  updateSupportTicketStatus,
} from '../services/supportService';

export const supportRouter = Router();

// Protect all support routes with authentication
supportRouter.use(requireAuth);

function getClientMeta(req: AuthRequest) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ipAddress, userAgent };
}

// POST /api/support/tickets (User creates support ticket)
supportRouter.post('/tickets', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { subject, category, description } = req.body;
    const validCategory = (category && Object.values(TicketCategory).includes(category))
      ? (category as TicketCategory)
      : TicketCategory.OTHER;

    const { ipAddress, userAgent } = getClientMeta(req);
    const ticket = await createSupportTicket(
      req.user.id,
      subject,
      validCategory,
      description,
      ipAddress,
      userAgent
    );

    return res.status(201).json({
      message: 'Support ticket created successfully.',
      ticket,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to create support ticket' });
  }
});

// GET /api/support/my-tickets (User views their own submitted support tickets)
supportRouter.get('/my-tickets', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tickets = await getUserSupportTickets(req.user.id);
    return res.status(200).json({ tickets });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to fetch user support tickets' });
  }
});

// GET /api/support/admin/tickets (Admin views system-wide support tickets)
supportRouter.get('/admin/tickets', requireRole([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as TicketStatus | undefined;
    const category = req.query.category as TicketCategory | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await getAdminSupportTickets({ search, status, category, page, limit });
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to fetch admin support tickets' });
  }
});

// PATCH /api/support/admin/tickets/:id/status (Admin updates support ticket status)
supportRouter.patch('/admin/tickets/:id/status', requireRole([Role.ADMIN]), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !Object.values(TicketStatus).includes(status)) {
      return res.status(400).json({ error: 'Invalid support ticket status.' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const updated = await updateSupportTicketStatus(
      req.user!.id,
      req.params.id,
      status as TicketStatus,
      ipAddress,
      userAgent
    );

    return res.status(200).json({
      message: `Support ticket status updated to ${status}.`,
      ticket: updated,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to update support ticket status' });
  }
});
