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
