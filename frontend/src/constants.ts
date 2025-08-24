// src/constants.ts

// API Configuration (supports CRA and Vite)
const viteApi = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || undefined;
const craApi = (typeof process !== 'undefined' && (process as any).env && (process as any).env.REACT_APP_API_BASE_URL) || undefined;
export const API_BASE_URL = viteApi || craApi || 'http://localhost:8000/api/v1';

// Authentication
export const AUTH_TOKEN_KEY = 'authToken';
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
