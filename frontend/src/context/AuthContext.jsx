/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, UNAUTHORIZED_EVENT } from '@/lib/api.js';
import { KEYS, getItem, getJSON, setItem, setJSON } from '@/lib/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getItem(KEYS.token));
  const [user, setUser] = useState(() => getJSON(KEYS.user));
  // `loading` is true until we have validated a stored token against the server.
  const [loading, setLoading] = useState(() => Boolean(getItem(KEYS.token)));

  const persist = useCallback((nextUser, nextToken) => {
    setUser(nextUser ?? null);
    setJSON(KEYS.user, nextUser ?? null);
    if (nextToken !== undefined) {
      setToken(nextToken ?? null);
      setItem(KEYS.token, nextToken ?? null);
    }
  }, []);

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  // Validate the stored session once on mount.
  useEffect(() => {
    if (!token) return undefined; // `loading` already starts as false when there is no token
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then((data) => persist(data.user))
      .catch((err) => {
        // Only drop the session if the server explicitly rejected the token.
        if (err.status === 401 || err.status === 403) logout();
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sign out if any authenticated request is rejected with 401 (expired/invalid token mid-session).
  useEffect(() => {
    const onUnauthorized = () => {
      if (getItem(KEYS.token)) logout();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const login = useCallback(
    async ({ identifier, password }) => {
      const data = await authApi.login({ identifier, password });
      persist(data.user, data.token);
      return data.user;
    },
    [persist],
  );

  const signup = useCallback(
    async ({ username, email, password }) => {
      const data = await authApi.signup({ username, email, password });
      persist(data.user, data.token);
      return data.user;
    },
    [persist],
  );

  const updateProfile = useCallback(
    async (payload) => {
      const data = await authApi.updateMe(payload);
      persist(data.user, data.token ?? undefined);
      return data.user;
    },
    [persist],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      signup,
      logout,
      updateProfile,
    }),
    [user, token, loading, login, signup, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
