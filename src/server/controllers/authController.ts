import { Response } from 'express';
import { firestore } from '../db/firestore.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js';
import { toError } from '../utils/toError.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

function nowIso(): string {
  return new Date().toISOString();
}

export async function signup(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password, username } = (req.body ?? {}) as Record<string, unknown>;
    if (
      !email ||
      typeof email !== 'string' ||
      !password ||
      typeof password !== 'string' ||
      !username ||
      typeof username !== 'string'
    ) {
      res.status(400).json({ error: 'Missing email, password or username' });
      return;
    }

    const users = firestore.collection('users');
    const existing = await users.where('email', '==', email).limit(1).get();
    if (!existing.empty) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const docRef = await users.add({
      email,
      passwordHash,
      username,
      createdAt: nowIso(),
    });

    const accessToken = signAccessToken({ sub: docRef.id, email });
    const refreshToken = signRefreshToken({ sub: docRef.id, email });

    res.status(201).json({
      user: { id: docRef.id, email, username },
      accessToken,
      refreshToken,
    });
  } catch (error: unknown) {
    const err = toError(error);
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }
    const users = firestore.collection('users');
    const snap = await users.where('email', '==', email).limit(1).get();
    if (snap.empty) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const doc = snap.docs[0]!;
    const data = doc.data();
    const ok = await comparePassword(password, String(data['passwordHash'] ?? ''));
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const accessToken = signAccessToken({ sub: doc.id, email: String(data['email']) });
    const refreshToken = signRefreshToken({ sub: doc.id, email: String(data['email']) });
    res.status(200).json({
      user: { id: doc.id, email: data['email'], username: data['username'] },
      accessToken,
      refreshToken,
    });
  } catch (error: unknown) {
    const err = toError(error);
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { refreshToken } = (req.body ?? {}) as Record<string, unknown>;
  if (!refreshToken || typeof refreshToken !== 'string') {
    res.status(400).json({ error: 'Missing refreshToken' });
    return;
  }
  try {
    const payload = verifyToken<{ sub: string; email: string; typ?: string }>(refreshToken);
    if (payload.typ !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }
    const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
    res.status(200).json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user?.id) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const userDoc = await firestore.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const data = userDoc.data() ?? {};
    res.status(200).json({
      id: userDoc.id,
      email: data['email'],
      username: data['username'],
      createdAt: data['createdAt'],
    });
  } catch (err: unknown) {
    console.error('getProfile error:', toError(err));
    res.status(500).json({ error: 'Internal server error' });
  }
}
