import { db } from '@/api/base44Client';

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Resolve the current session from the browser-local backend.
  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await db.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = useCallback(async (email, password) => {
    const loggedIn = await db.auth.loginViaEmailPassword(email, password);
    setUser(loggedIn);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return loggedIn;
  }, []);

  const register = useCallback(async ({ email, password, full_name }) => {
    const created = await db.auth.register({ email, password, full_name });
    setUser(created);
    setIsAuthenticated(true);
    setAuthChecked(true);
    return created;
  }, []);

  const logout = useCallback(() => {
    db.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        // Compatibility fields kept for components that still read them.
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: {},
        login,
        register,
        logout,
        checkUserAuth,
        refreshUser: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
