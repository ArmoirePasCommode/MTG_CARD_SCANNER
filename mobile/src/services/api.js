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
  if (error.message) return error.message;
  return 'Unexpected error';
};

export const loginRequest = async ({ email, password }) => {
  try {
    const { data } = await client.post('/auth/login', { email, password });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const registerRequest = async ({ email, password, displayName }) => {
  try {
    const { data } = await client.post('/auth/register', { email, password, displayName });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchProfile = async () => {
  try {
    const { data } = await client.get('/auth/me');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const addCard = async (cardPayload) => {
  try {
    const { data } = await client.post('/cards', cardPayload);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const getCards = async () => {
  try {
    const { data } = await client.get('/cards');
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteCard = async (cardId) => {
  try {
    await client.delete(`/cards/${cardId}`);
    return true;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const uploadCardImage = async ({ uri, mimeType = 'image/jpeg', fileName = 'upload.jpg' }) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: mimeType,
      name: fileName
    });
    const { data } = await client.post('/cards/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export default client;

