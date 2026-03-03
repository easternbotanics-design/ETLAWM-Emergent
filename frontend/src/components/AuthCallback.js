import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL hash
        const hash = location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);

        if (!sessionIdMatch) {
          console.error('No session_id found in URL');
          navigate('/login');
          return;
        }

        const sessionId = sessionIdMatch[1];
        console.log('Processing Google OAuth callback with session_id');

        // Exchange session_id for session_token
        const response = await axios.post(
          `${API_URL}/api/auth/google/session`,
          {},
          {
            headers: { 'X-Session-ID': sessionId },
            withCredentials: true
          }
        );

        console.log('Google auth successful, user:', response.data.user);

        // Set user in context
        setUser(response.data.user);

        // Store user in localStorage as backup
        localStorage.setItem('etlawm_user', JSON.stringify(response.data.user));

        // Wait a moment for state to propagate
        await new Promise(resolve => setTimeout(resolve, 500));

        // Navigate to shop without state (user is now in context)
        navigate('/shop', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        console.error('Error details:', error.response?.data);
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback-loading">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm uppercase tracking-widest">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;