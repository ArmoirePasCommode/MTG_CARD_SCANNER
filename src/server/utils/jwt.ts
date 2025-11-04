import jwt from 'jsonwebtoken';
import { env } from '../config';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload, typ: 'refresh' }, env.JWT_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}


