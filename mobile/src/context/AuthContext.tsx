import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import { loginRequest, registerRequest, setAuthToken, fetchProfile } from '../services/api';
import type { User } from '../types/api';

const STORAGE_KEY = 'MTG_CARD_SCANNER_TOKEN';

const safeSecureStore = {
  getItemAsync: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error: unknown) {
      console.warn('SecureStore.getItemAsync failed', error);
      return null;
    }
  },
  setItemAsync: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error: unknown) {
      console.warn('SecureStore.setItemAsync failed', error);
    }
  },
  deleteItemAsync: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error: unknown) {
      console.warn('SecureStore.deleteItemAsync failed', error);
    }
  },
};

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const persistToken = useCallback(async (newToken: string | null): Promise<void> => {
    if (newToken) {
      await safeSecureStore.setItemAsync(STORAGE_KEY, newToken);
    } else {
      await safeSecureStore.deleteItemAsync(STORAGE_KEY);
    }
  }, []);

  const bootstrap = useCallback(async (): Promise<void> => {
    try {
      const storedToken = await safeSecureStore.getItemAsync(STORAGE_KEY);
      if (storedToken) {
        setAuthToken(storedToken);
        setToken(storedToken);
        const profile = await fetchProfile();
        setUser(profile);
      }
    } catch (error: unknown) {
      console.warn('Failed to restore auth session', error);
      setAuthToken(null);
      await persistToken(null);
    } finally {
      setInitializing(false);
    }
  }, [persistToken]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
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
    async (payload: { email: string; password: string; displayName: string }): Promise<User> => {
      const { accessToken, user: authUser } = await registerRequest(payload);
      setAuthToken(accessToken);
      setToken(accessToken);
      setUser(authUser);
      await persistToken(accessToken);
      return authUser;
    },
    [persistToken]
  );

  const refreshProfile = useCallback(async (): Promise<User | null> => {
    if (!token) return null;
    const profile = await fetchProfile();
    setUser(profile);
    return profile;
  }, [token]);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    setToken(null);
    await persistToken(null);
    setAuthToken(null);
  }, [persistToken]);

  const value = useMemo<AuthContextValue>(
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

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
