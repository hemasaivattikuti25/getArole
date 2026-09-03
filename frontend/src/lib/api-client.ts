import axios from 'axios';

/**
 * Core API Client
 * Automatically points to /api route which is proxied to FastAPI backend via Next.js rewrites.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Auth Tokens if available
apiClient.interceptors.request.use(
  (config) => {
    // In a real scenario, you'd get the token from localStorage or Zustand state
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response.data, // Strip the axios wrapper and return just the data payload
  (error) => {
    // You can integrate global toast notifications here (e.g., using sonner)
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    console.error('[API Error]:', message);
    
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      // e.g. window.location.href = '/onboarding';
    }
    
    return Promise.reject(error);
  }
);
