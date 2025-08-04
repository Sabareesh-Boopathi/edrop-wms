import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for logging and adding token
api.interceptors.request.use(
  (config) => {
    console.log('Starting Request', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers,
    });
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response Error:', {
        status: error.response.status,
        data: error.response.data,
      });
      if (error.response.status === 401 || error.response.status === 403) {
        // Token is invalid or expired
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // Redirect to login page
        window.location.href = '/login';
      }
    } else {
      console.error('An unexpected error occurred:', error);
    }
    return Promise.reject(error);
  }
);

export default api;

