import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  Constants?.expoConfig?.extra?.backendUrl ||
  'http://localhost:8080';

const client = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000
});

export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
};

const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return 'Unexpected error';
};

export const loginRequest = async ({ email, password }) => {
  try {
    const { data } = await client.post('/api/auth/login', { email, password });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const registerRequest = async ({ email, password, displayName }) => {
  try {
    const { data } = await client.post('/api/auth/signup', { email, password, username: displayName });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchProfile = async () => {
  try {
    const { data } = await client.get('/api/auth/me');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const addCard = async (cardPayload) => {
  try {
    const { data } = await client.post('/api/cards', cardPayload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getCards = async () => {
  try {
    const { data } = await client.get('/api/cards');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteCard = async (cardId) => {
  try {
    await client.delete(`/api/cards/${cardId}`);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Sends a card image to the backend OCR endpoint.
 * Returns { text: string, cardName: string }
 */
export const recognizeCardImage = async ({ uri, mimeType = 'image/jpeg', fileName = 'card.jpg' }) => {
  try {
    const formData = new FormData();
    formData.append('image', { uri, type: mimeType, name: fileName });
    const { data } = await client.post('/api/cards/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default client;
