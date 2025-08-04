// src/constants.ts

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// Authentication
export const AUTH_TOKEN_KEY = 'authToken';
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
