import axios from 'axios';

const adminClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach admin token
adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminAuthToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminAuthToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminClient;
