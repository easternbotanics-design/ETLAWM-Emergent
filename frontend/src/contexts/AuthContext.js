import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('etlawm_user');
    localStorage.removeItem('etlawm_session_token');
  };

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('etlawm_session_token');

    // If there is no token at all, don't bother calling the server —
    // the user is definitely not authenticated.
    if (!storedToken) {
      clearAuthState();
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      setUser(response.data);
      localStorage.setItem('etlawm_user', JSON.stringify(response.data));
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        // Server explicitly rejected the session — it is invalid or expired.
        // Clear everything so the user is shown as logged out.
        console.warn('[Auth] Session rejected by server (status', status, '). Clearing auth state.');
        clearAuthState();
      } else {
        // Network error or server unavailable — fall back to cached user
        // so the UI doesn't flicker to "logged out" on a bad network.
        const storedUser = localStorage.getItem('etlawm_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            clearAuthState();
          }
        } else {
          clearAuthState();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    const { user: loggedInUser, session_token } = response.data;
    setUser(loggedInUser);
    localStorage.setItem('etlawm_user', JSON.stringify(loggedInUser));
    if (session_token) {
      localStorage.setItem('etlawm_session_token', session_token);
    }
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      { email, password, name }
    );
    // After registration, log them in to get a session token
    await login(email, password);
    return response.data;
  };

  const logout = async () => {
    const storedToken = localStorage.getItem('etlawm_session_token');
    try {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
        }
      );
    } catch (e) {
      console.warn('Logout API call failed (clearing local state anyway):', e.message);
    }
    clearAuthState();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, clearAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};