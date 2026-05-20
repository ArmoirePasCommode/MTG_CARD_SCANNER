import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../config.js';

export interface JwtPayload {
  sub: string; // user id
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as unknown as any };
  return jwt.sign(payload as any, env.JWT_SECRET as unknown as Secret, options);
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as unknown as any };
  return jwt.sign(
    { ...payload, typ: 'refresh' } as any,
    env.JWT_SECRET as unknown as Secret,
    options
  );
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
