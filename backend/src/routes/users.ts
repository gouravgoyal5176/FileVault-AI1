import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';
import { deleteUserSelf } from '../services/userService';

export const userRouter = Router();

// Protect all user routes with authentication
userRouter.use(requireAuth);

function getClientMeta(req: AuthRequest) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ipAddress, userAgent };
}

// DELETE /api/users/me (Authenticated user self account deletion)
userRouter.delete('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await deleteUserSelf(req.user.id, ipAddress, userAgent);

    // Clear refresh cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to delete account' });
  }
});
