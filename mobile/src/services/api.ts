import { fetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system/next';
import Constants from 'expo-constants';

import type {
  AuthResponse,
  BulkAddResponse,
  Card,
  CardUpdate,
  NewCard,
  RecognizeResponse,
  TagInfo,
  TagRequest,
} from '../types/api';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ??
  (Constants?.expoConfig?.extra as Record<string, string> | undefined)?.backendUrl ??
  'http://localhost:8080';

const DEFAULT_TIMEOUT_MS = 15000;

let _authToken: string | null = null;

export const setAuthToken = (token: string | null | undefined): void => {
  _authToken = token ?? null;
};

export const getAuthToken = (): string | null => _authToken;

const buildHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;
  return headers;
};

interface TimeoutHandle {
  signal: AbortSignal;
  cancel: () => void;
}

const withTimeout = (
  signal: AbortSignal | undefined,
  timeoutMs = DEFAULT_TIMEOUT_MS
): TimeoutHandle => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
};

export class ApiRequestError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.payload = payload;
  }
}

const parseError = async (response: Response): Promise<ApiRequestError> => {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // body wasn't JSON
  }
  const message =
    (payload?.['error'] as string | undefined) ??
    (payload?.['message'] as string | undefined) ??
    `Request failed with status ${response.status}`;
  return new ApiRequestError(message, response.status, payload);
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const request = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
  const { method = 'GET', body, headers, timeoutMs, signal } = options;
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders = buildHeaders({
    ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  });

  const { signal: timedSignal, cancel } = withTimeout(signal, timeoutMs);

  try {
    const resolvedBody = body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : null;

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      ...(resolvedBody !== null ? { body: resolvedBody } : {}),
      signal: timedSignal,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) return null as T;

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as T;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    cancel();
  }
};

export const loginRequest = (credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body: credentials });

export const registerRequest = (payload: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> =>
  request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: { email: payload.email, password: payload.password, username: payload.displayName },
  });

export const fetchProfile = (): Promise<AuthResponse['user']> =>
  request<AuthResponse['user']>('/api/auth/me');

export const addCard = (cardPayload: NewCard): Promise<Card> =>
  request<Card>('/api/cards', { method: 'POST', body: cardPayload });

export const updateCard = (cardId: string, patch: CardUpdate): Promise<Card> =>
  request<Card>(`/api/cards/${cardId}`, { method: 'PATCH', body: patch });

export const bulkAddCards = (cards: NewCard[]): Promise<BulkAddResponse> =>
  request<BulkAddResponse>('/api/cards/bulk', { method: 'POST', body: { cards } });

export const tagCards = (payload: TagRequest): Promise<{ ok: boolean }> =>
  request<{ ok: boolean }>('/api/cards/tag', { method: 'POST', body: payload });

export const getCards = (): Promise<Card[]> => request<Card[]>('/api/cards');

export const deleteCard = (cardId: string): Promise<null> =>
  request<null>(`/api/cards/${cardId}`, { method: 'DELETE' });

export const getTags = (): Promise<TagInfo[]> => request<TagInfo[]>('/api/tags');

export const renameTag = (from: string, to: string): Promise<{ updated: number }> =>
  request<{ updated: number }>('/api/tags/rename', { method: 'POST', body: { from, to } });

export const deleteTag = (name: string): Promise<{ updated: number }> =>
  request<{ updated: number }>(`/api/tags/${encodeURIComponent(name)}`, { method: 'DELETE' });

/**
 * Sends a card image to the backend OCR endpoint.
 * Returns { text: string, cardName: string }
 *
 * Reads the file as base64 and sends it as JSON to avoid FormData/fetch
 * compatibility issues with expo/fetch.
 */
export const recognizeCardImage = async ({
  uri,
  mimeType = 'image/jpeg',
}: {
  uri: string;
  mimeType?: string;
}): Promise<RecognizeResponse> => {
  const imageBase64 = await new ExpoFile(uri).base64();
  return request<RecognizeResponse>('/api/cards/recognize', {
    method: 'POST',
    body: { imageBase64, mimeType },
    timeoutMs: 30000,
  });
};

export default {
  loginRequest,
  registerRequest,
  fetchProfile,
  addCard,
  updateCard,
  bulkAddCards,
  tagCards,
  getCards,
  deleteCard,
  getTags,
  renameTag,
  deleteTag,
  recognizeCardImage,
  setAuthToken,
  getAuthToken,
};
