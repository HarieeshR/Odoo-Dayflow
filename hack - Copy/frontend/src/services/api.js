import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dayflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we're already redirecting to prevent loops
let isRedirecting = false;

// Response interceptor: handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // 401 Unauthorized - redirect to login (only once, and not if already on auth pages)
      if (status === 401 && !isRedirecting) {
        const currentPath = window.location.pathname;
        const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(currentPath);
        
        if (!isAuthPage) {
          isRedirecting = true;
          localStorage.removeItem('dayflow_token');
          localStorage.removeItem('dayflow_user');
          window.location.href = '/login';
          // Reset after a delay
          setTimeout(() => { isRedirecting = false; }, 3000);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
