export type { Card, NewCard, CardUpdate } from '../server/models/Card.js';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  createdAt?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface TagInfo {
  name: string;
  count: number;
}

export interface TagRequest {
  cardIds: string[];
  add?: string[];
  remove?: string[];
}

export interface RenameTagRequest {
  from: string;
  to: string;
}

export interface RecognizeResponse {
  text: string;
  cardName: string | null;
}

export interface SyncResponse {
  changes: import('../server/models/Card.js').Card[];
  cursor: string;
}

export interface ApiError {
  error: string;
  details?: string;
}
