import { Router, Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from '../validators/authValidation';
import {
  registerUser,
  loginUser,
  adminLoginUser,
  sendLoginOtp,
  verifyLoginOtp,
  authenticateGoogleUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  refreshAccessToken,
  logoutUser,
  logoutAllDevices,
} from '../services/authService';
import { requireAuth, AuthRequest } from '../middleware/authMiddleware';

export const authRouter = Router();

// Utility helper to get IP & User Agent
function getClientMeta(req: Request) {
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  return { ipAddress, userAgent };
}

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await registerUser(parseResult.data, res, ipAddress, userAgent);

    return res.status(201).json({
      message: 'Account created successfully.',
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await loginUser(parseResult.data, res, ipAddress, userAgent);

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || 'Login failed',
      lockoutUntil: error.lockoutUntil,
    });
  }
});

// POST /api/auth/admin/login (Dedicated Admin Authentication without OTP)
authRouter.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await adminLoginUser(parseResult.data, res, ipAddress, userAgent);

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({
      error: error.message || 'Admin authentication failed',
      lockoutUntil: error.lockoutUntil,
    });
  }
});

// POST /api/auth/login/otp/send (Resend Login MFA OTP)
authRouter.post('/login/otp/send', async (req: Request, res: Response) => {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const result = await sendLoginOtp(parseResult.data.email);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to send login verification code' });
  }
});

// POST /api/auth/login/otp/verify (Verify Login MFA OTP and issue session)
authRouter.post('/login/otp/verify', async (req: Request, res: Response) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await verifyLoginOtp(parseResult.data.email, parseResult.data.otp, res, ipAddress, userAgent);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ error: error.message || 'Verification failed' });
  }
});

// POST /api/auth/google (Google Identity Services GIS ID-Token Auth)
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const parseResult = googleAuthSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await authenticateGoogleUser(parseResult.data.idToken, res, ipAddress, userAgent);

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({ error: error.message || 'Google authentication failed' });
  }
});

// POST /api/auth/otp/send (Send Registration OTP via Gmail SMTP)
authRouter.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const result = await sendRegistrationOtp(parseResult.data.email);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || 'Failed to send verification code' });
  }
});

// POST /api/auth/otp/verify (Verify Registration OTP from Redis)
authRouter.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((i) => i.message),
      });
    }

    const result = await verifyRegistrationOtp(parseResult.data.email, parseResult.data.otp);
    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    return res.status(statusCode).json({ error: error.message || 'Verification failed' });
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { ipAddress, userAgent } = getClientMeta(req);
    const result = await refreshAccessToken(refreshToken, res, ipAddress, userAgent);

    return res.status(200).json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({ error: error.message || 'Token refresh failed' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const result = await logoutUser(refreshToken, res, req.user?.id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/logout-all
authRouter.post('/logout-all', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await logoutAllDevices(req.user.id, res);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Logout all failed' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  return res.status(200).json({
    user: req.user,
  });
});
