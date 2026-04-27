import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { loginRequest, registerRequest, setAuthToken, fetchProfile } from '../services/api';

const STORAGE_KEY = 'MTG_CARD_SCANNER_TOKEN';

const safeSecureStore = {
  getItemAsync: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore.getItemAsync failed', error);
      return null;
    }
  },
  setItemAsync: async (key, value) => {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore.setItemAsync failed', error);
    }
  },
  deleteItemAsync: async (key) => {
    try {
      return await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore.deleteItemAsync failed', error);
    }
  },
};

const AuthContext = createContext({
  user: null,
  token: null,
  initializing: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const persistToken = useCallback(async (newToken) => {
    if (newToken) {
      await safeSecureStore.setItemAsync(STORAGE_KEY, newToken);
    } else {
      await safeSecureStore.deleteItemAsync(STORAGE_KEY);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const storedToken = await safeSecureStore.getItemAsync(STORAGE_KEY);
      if (storedToken) {
        setAuthToken(storedToken);
        setToken(storedToken);
        const profile = await fetchProfile();
        setUser(profile);
      }
    } catch (error) {
      console.warn('Failed to restore auth session', error);
      setAuthToken(null);
      await persistToken(null);
    } finally {
      setInitializing(false);
    }
  }, [persistToken]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email, password) => {
      const { accessToken, user: authUser } = await loginRequest({ email, password });
      setAuthToken(accessToken);
      setToken(accessToken);
      setUser(authUser);
      await persistToken(accessToken);
      return authUser;
    },
    [persistToken]
  );

  const register = useCallback(
    async (payload) => {
      const { accessToken, user: authUser } = await registerRequest(payload);
      setAuthToken(accessToken);
      setToken(accessToken);
      setUser(authUser);
      await persistToken(accessToken);
      return authUser;
    },
    [persistToken]
  );

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    const profile = await fetchProfile();
    setUser(profile);
    return profile;
  }, [token]);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await persistToken(null);
    setAuthToken(null);
  }, [persistToken]);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, token, initializing, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
