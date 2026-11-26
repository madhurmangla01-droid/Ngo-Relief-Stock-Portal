import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '../services/api';
import type { UserProfile } from '../types';

export interface RegisterNgoInput {
  ngoName: string;
  registrationNumber: string;
  cityState: string;
  focusArea: string;
  officialPhone: string;
  displayName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (registrationNumber: string, email: string, password: string) => Promise<void>;
  registerNgo: (payload: RegisterNgoInput) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: {
    displayName: string;
    role: string;
    avatarUrl: string | null;
  }) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (registrationNumber: string, email: string, password: string) => {
    const res = await api.login({ registrationNumber, email, password });
    setAuthToken(res.token);
    setUser(res.user);
  }, []);

  const registerNgo = useCallback(async (payload: RegisterNgoInput) => {
    const res = await api.registerNgo(payload);
    setAuthToken(res.token);
    setUser(res.user);
  }, []);

  const updateProfile = useCallback(
    async (payload: { displayName: string; role: string; avatarUrl: string | null }) => {
      const res = await api.updateProfile(payload);
      setUser(res.user);
      return res.user;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        registerNgo,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return ctx;
}
