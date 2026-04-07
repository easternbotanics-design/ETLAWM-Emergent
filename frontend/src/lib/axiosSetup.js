import axios from 'axios';

/**
 * Global Axios request interceptor.
 * Attaches the session token from localStorage as an Authorization header
 * on every outgoing request. This is a fallback for cross-origin deployments
 * where cookies (SameSite=None; Secure) may be blocked by the browser.
 */
axios.interceptors.request.use(
  (config) => {
    const storedToken = localStorage.getItem('etlawm_session_token');
    if (storedToken) {
      config.headers = config.headers || {};
      // Don't overwrite if the caller already set an Authorization header
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Global Axios response interceptor.
 * When the backend returns 401 (Not authenticated / Invalid session / Session expired),
 * it means the stored token is stale. Clear local auth state and redirect to /login.
 * This prevents the ghost-login state where the user appears logged in but can't
 * perform authenticated actions.
 */
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail || '';
      // Only clear + redirect for real auth failures, not for 401s on the login route itself
      const isAuthRoute = error.config?.url?.includes('/api/auth/login') ||
                          error.config?.url?.includes('/api/auth/register') ||
                          error.config?.url?.includes('/api/auth/me');

      if (!isAuthRoute) {
        console.warn('[Auth] 401 received on protected route — clearing session and redirecting to login.');
        localStorage.removeItem('etlawm_session_token');
        localStorage.removeItem('etlawm_user');
        // Redirect to login, preserving where they were trying to go
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = `/login?expired=1&from=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);
