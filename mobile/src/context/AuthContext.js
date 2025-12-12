import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Helper to safely access SecureStore
const safeSecureStore = {
  getItemAsync: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore.getItemAsync failed - native module might be missing', error);
      return null;
    }
  },
  setItemAsync: async (key, value) => {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('SecureStore.setItemAsync failed - native module might be missing', error);
    }
  },
  deleteItemAsync: async (key) => {
    try {
      return await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore.deleteItemAsync failed - native module might be missing', error);
    }
  }
};

import { loginRequest, registerRequest, setAuthToken, fetchProfile } from '../services/api';

const STORAGE_KEY = 'MTG_CARD_SCANNER_TOKEN';

const AuthContext = createContext({
  user: null,
  token: null,
  initializing: true,
  login: async () => { },
  register: async () => { },
  logout: async () => { },
  refreshProfile: async () => { }
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

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
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const persistToken = async (newToken) => {
    if (newToken) {
      await safeSecureStore.setItemAsync(STORAGE_KEY, newToken);
    } else {
      await safeSecureStore.deleteItemAsync(STORAGE_KEY);
    }
  };

  const login = useCallback(async (email, password) => {
    const { accessToken: authToken, user: authUser } = await loginRequest({ email, password });
    setAuthToken(authToken);
    setToken(authToken);
    setUser(authUser);
    await persistToken(authToken);
    return authUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { accessToken: authToken, user: authUser } = await registerRequest(payload);
    setAuthToken(authToken);
    setToken(authToken);
    setUser(authUser);
    await persistToken(authToken);
    return authUser;
  }, []);

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
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      login,
      register,
      logout,
      refreshProfile
    }),
    [user, token, initializing, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;

