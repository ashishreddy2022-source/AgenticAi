import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('agentflow_auth');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const token = parsed?.token || parsed?.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          console.error('Failed to parse auth token:', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract clean error message and handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // If token is invalid or user was in previous transient session, clear stale token
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && currentPath !== '/') {
        localStorage.removeItem('agentflow_auth');
      }
    }

    const customError = {
      status: error.response?.status || 500,
      code: error.response?.data?.error || 'NETWORK_ERROR',
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      details: error.response?.data?.details || null,
    };
    return Promise.reject(customError);
  }
);

export default api;
