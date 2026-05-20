import { fetch } from 'expo/fetch';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  Constants?.expoConfig?.extra?.backendUrl ||
  'http://localhost:8080';

const DEFAULT_TIMEOUT_MS = 15000;

let _authToken = null;

export const setAuthToken = (token) => {
  _authToken = token || null;
};

export const getAuthToken = () => _authToken;

const buildHeaders = (extra = {}) => {
  const headers = { Accept: 'application/json', ...extra };
  if (_authToken) headers.Authorization = `Bearer ${_authToken}`;
  return headers;
};

const withTimeout = (signal, timeoutMs = DEFAULT_TIMEOUT_MS) => {
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

const parseError = async (response) => {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // body wasn't JSON
  }
  const message =
    payload?.error ||
    payload?.message ||
    `Request failed with status ${response.status}`;
  const err = new Error(message);
  err.status = response.status;
  err.payload = payload;
  return err;
};

const request = async (path, { method = 'GET', body, headers, timeoutMs, signal } = {}) => {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders = buildHeaders({
    ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  });

  const { signal: timedSignal, cancel } = withTimeout(signal, timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: timedSignal,
    });

    if (!response.ok) {
      throw await parseError(response);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    cancel();
  }
};

export const loginRequest = ({ email, password }) =>
  request('/api/auth/login', { method: 'POST', body: { email, password } });

export const registerRequest = ({ email, password, displayName }) =>
  request('/api/auth/signup', {
    method: 'POST',
    body: { email, password, username: displayName },
  });

export const fetchProfile = () => request('/api/auth/me');

export const addCard = (cardPayload) =>
  request('/api/cards', { method: 'POST', body: cardPayload });

export const updateCard = (cardId, patch) =>
  request(`/api/cards/${cardId}`, { method: 'PATCH', body: patch });

export const bulkAddCards = (cards) =>
  request('/api/cards/bulk', { method: 'POST', body: { cards } });

export const tagCards = ({ cardIds, add, remove }) =>
  request('/api/cards/tag', { method: 'POST', body: { cardIds, add, remove } });

export const getCards = () => request('/api/cards');

export const deleteCard = (cardId) =>
  request(`/api/cards/${cardId}`, { method: 'DELETE' });

export const getTags = () => request('/api/tags');

export const renameTag = (from, to) =>
  request('/api/tags/rename', { method: 'POST', body: { from, to } });

export const deleteTag = (name) =>
  request(`/api/tags/${encodeURIComponent(name)}`, { method: 'DELETE' });

/**
 * Sends a card image to the backend OCR endpoint.
 * Returns { text: string, cardName: string }
 *
 * Reads the file as base64 and sends it as JSON to avoid FormData/fetch
 * compatibility issues with expo/fetch (which does not support the RN-style
 * { uri, type, name } FormData part).
 */
export const recognizeCardImage = async ({ uri, mimeType = 'image/jpeg' }) => {
  const imageBase64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  return request('/api/cards/recognize', {
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
