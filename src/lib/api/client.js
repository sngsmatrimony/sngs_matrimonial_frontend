import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout to prevent hung requests
});

// Add token to requests if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData requests
  // For FormData, let axios set multipart/form-data automatically with proper boundary
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Handle response errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from the login endpoint itself just means wrong credentials —
    // not an expired session. Redirecting there would hard-reload /login
    // and wipe the error toast/message before the user can read it.
    const isLoginRequest = error.config?.url?.includes('/api/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      // Token expired or invalid - clear auth, including the saved session
      // (authStore's persisted copy). Leaving that behind kept the app
      // "signed in" after the reload: the navbar showed member links, the
      // homepage sent the visitor to /browse, the next call failed again and
      // they were bounced back to /login — never seeing the homepage.
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-store');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { client };
export default client;
