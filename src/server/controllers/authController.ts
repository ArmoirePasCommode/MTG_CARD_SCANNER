import { Response } from 'express';
import { firestore } from '../db/firestore.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

function nowIso(): string {
  return new Date().toISOString();
}

export async function signup(req: AuthenticatedRequest, res: Response) {
  const { email, password, username } = req.body || {};
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing email, password or username' });
  }

  const users = firestore.collection('users');
  const existing = await users.where('email', '==', email).limit(1).get();
  if (!existing.empty) {
    return res.status(409).json({ error: 'Email already in use' });
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

  return res.status(201).json({
    user: { id: docRef.id, email, username },
    accessToken,
    refreshToken,
  });
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  const users = firestore.collection('users');
  const snap = await users.where('email', '==', email).limit(1).get();
  if (snap.empty) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const doc = snap.docs[0]!;
  const data = doc.data();
  const ok = await comparePassword(password, data.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const accessToken = signAccessToken({ sub: doc.id, email: data.email });
  const refreshToken = signRefreshToken({ sub: doc.id, email: data.email });
  return res.status(200).json({
    user: { id: doc.id, email: data.email, username: data.username },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: AuthenticatedRequest, res: Response) {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refreshToken' });
  }
  try {
    const payload = verifyToken<{ sub: string; email: string; typ?: string }>(refreshToken);
    if (payload.typ !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
    return res.status(200).json({ accessToken });
  } catch (_e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const userDoc = await firestore.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const data = userDoc.data() || {};
    return res.status(200).json({
      id: userDoc.id,
      email: data.email,
      username: data.username,
      createdAt: data.createdAt
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



