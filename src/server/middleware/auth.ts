import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  try {
    const payload = verifyToken<{ sub: string; email: string }>(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


