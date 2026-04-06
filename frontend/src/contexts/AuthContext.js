import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const checkAuth = async () => {
    try {
      const headers = {};
      const storedToken = localStorage.getItem('etlawm_session_token');
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        withCredentials: true,
        headers
      });
      setUser(response.data);
      localStorage.setItem('etlawm_user', JSON.stringify(response.data));
    } catch (error) {
      // If API fails, check localStorage as fallback
      const storedUser = localStorage.getItem('etlawm_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser(null);
          localStorage.removeItem('etlawm_user');
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      checkAuth();
    }
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data.user);
    localStorage.setItem('etlawm_user', JSON.stringify(response.data.user));
    // Store session token for Authorization header fallback (cross-origin cookie fix)
    if (response.data.session_token) {
      localStorage.setItem('etlawm_session_token', response.data.session_token);
    }
    return response.data;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(
      `${API_URL}/api/auth/register`,
      { email, password, name }
    );
    // After registration, log them in
    await login(email, password);
    return response.data;
  };

  const logout = async () => {
    const headers = {};
    const storedToken = localStorage.getItem('etlawm_session_token');
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true, headers });
    } catch (e) {
      // Still clear local state even if server logout fails
      console.warn('Logout API call failed:', e.message);
    }
    setUser(null);
    localStorage.removeItem('etlawm_user');
    localStorage.removeItem('etlawm_session_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
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