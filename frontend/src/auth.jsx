import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAccessToken as syncAccessToken } from './api.js';

const AuthContext = createContext(null);
let bootstrapSessionPromise = null;

function loadInitialSession() {
  if (!bootstrapSessionPromise) {
    bootstrapSessionPromise = api.refresh()
      .catch(() => null)
      .finally(() => {
        bootstrapSessionPromise = null;
      });
  }

  return bootstrapSessionPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setSessionAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadInitialSession()
      .then(session => {
        if (!active) {
          return;
        }
        if (!session) {
          setUser(null);
          setSessionAccessToken(null);
          syncAccessToken(null);
          return;
        }

        setUser(session.user);
        setSessionAccessToken(session.accessToken);
        syncAccessToken(session.accessToken);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    isAuthenticated: Boolean(user && accessToken),
    async login(credentials) {
      const response = await api.login(credentials);
      
      // Check if 2FA is required
      if (response.requiresTwoFactor) {
        return response;
      }

      // Normal login flow
      setUser(response.user);
      setSessionAccessToken(response.accessToken);
      syncAccessToken(response.accessToken);
      return response;
    },
    async verify2FA(userId, token, useBackupCode) {
      const response = await api.verify2FALogin({
        userId,
        token,
        useBackupCode
      });

      // 2FA verified - now we have the session
      setUser(response.user);
      setSessionAccessToken(response.accessToken);
      syncAccessToken(response.accessToken);
      return response;
    },
    async register(credentials) {
      const session = await api.register(credentials);
      setUser(session.user);
      setSessionAccessToken(session.accessToken);
      syncAccessToken(session.accessToken);
      return session;
    },
    async logout() {
      await api.logout();
      setUser(null);
      setSessionAccessToken(null);
      syncAccessToken(null);
    },
    async refresh() {
      const session = await api.refresh();
      setUser(session.user);
      setSessionAccessToken(session.accessToken);
      syncAccessToken(session.accessToken);
      return session;
    }
  }), [accessToken, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
