import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prevent double execution
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL hash
        const hash = location.hash;
        let sessionId = null;

        if (hash) {
          const sessionIdMatch = hash.match(/session_id=([^&]+)/);
          if (sessionIdMatch) {
            sessionId = sessionIdMatch[1];
          }
        }

        if (!sessionId) {
          setError('No session ID found. Please try logging in again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Exchange session_id for session_token
        const response = await axios.post(
          `${API_URL}/api/auth/google/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );

        // Set user in context
        setUser(response.data.user);

        // Store in localStorage for persistence
        localStorage.setItem('etlawm_user', JSON.stringify(response.data.user));
        if (response.data.session_token) {
          localStorage.setItem('etlawm_session_token', response.data.session_token);
        }

        // Give React time to update state
        await new Promise(resolve => setTimeout(resolve, 300));

        navigate('/shop', { replace: true });
      } catch (error) {
        setError(error.response?.data?.detail || 'Authentication failed. Please try again.');
        
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processSession();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white" data-testid="auth-callback-loading">
      <div className="text-center max-w-md px-6">
        {!error ? (
          <>
            <div className="w-20 h-20 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="font-display text-2xl mb-4">Completing Sign In</h2>
            <p className="text-sm text-neutral-600">
              Please wait while we securely log you in...
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="font-display text-2xl mb-4 text-red-600">Authentication Error</h2>
            <p className="text-sm text-neutral-600 mb-4">{error}</p>
            <p className="text-xs text-neutral-500">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;