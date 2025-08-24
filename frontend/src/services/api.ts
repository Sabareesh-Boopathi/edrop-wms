import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants';

const LOGOUT_SENTINEL = 'AUTH_FORCE_LOGOUT';

const api = axios.create({ baseURL: API_BASE_URL });
// Raw client without interceptors to avoid recursion when refreshing
const rawApi = axios.create({ baseURL: API_BASE_URL });

// Simple in-memory timer for pre-expiry warning
let preExpiryTimer: number | null = null;
let tokenExpMs: number | null = null;
let refreshPromise: Promise<string | null> | null = null;

// Cross-tab listener: if any tab sets logout sentinel, redirect
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === LOGOUT_SENTINEL && e.newValue === '1') {
      window.location.href = '/login';
    }
  });
}

function parseJwt(token: string): { exp?: number } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {} as any;
  }
}

export async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const existing = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!existing) return null;
      const resp = await rawApi.post('/login/refresh-token', undefined, {
        headers: { Authorization: `Bearer ${existing}` },
      });
      const newToken = resp.data?.access_token;
      if (newToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, newToken);
        schedulePreExpiryWarning(newToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function schedulePreExpiryWarning(token: string) {
  if (preExpiryTimer) {
    window.clearTimeout(preExpiryTimer);
    preExpiryTimer = null;
  }
  const payload = parseJwt(token);
  if (!payload.exp) return;
  const expMs = payload.exp * 1000;
  tokenExpMs = expMs;
  const now = Date.now();
  const msUntilWarn = Math.max(expMs - now - 60_000, 0);
  preExpiryTimer = window.setTimeout(() => {
    const event = new CustomEvent('token-pre-expiry');
    window.dispatchEvent(event);
  }, msUntilWarn);
}

// Only login endpoints are public
const PUBLIC_PATHS = ['/login/access-token', '/login/refresh-token'];

api.interceptors.request.use(
  (config) => {
    const url = (config.url || '').replace(API_BASE_URL, '');
    const isPublic = PUBLIC_PATHS.some((p) => url.endsWith(p));
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!isPublic && token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      schedulePreExpiryWarning(token);
    }
    // Enforce client-side read-only for VIEWER
    try {
      const role = (localStorage.getItem('AUTH_USER_ROLE') || '').toUpperCase();
      const method = (config.method || 'get').toUpperCase();
      if (role === 'VIEWER' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Allow auth endpoints
        if (!isPublic) {
          const err: any = {
            isAxiosError: true,
            response: { status: 403, data: { detail: 'VIEWER cannot modify data' } },
            config: { ...config, __viewerWriteBlock: true },
          };
          return Promise.reject(err);
        }
      }
  } catch (e) { /* ignore role check errors */ }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const cfg = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const url = cfg?.url || '';

    // Never try to refresh for refresh-token endpoint to avoid loops
    if (url.endsWith('/login/refresh-token')) {
      return Promise.reject(error);
    }

    const isLoginCall = url.endsWith('/login/access-token');
    const isPublic = PUBLIC_PATHS.some((p) => url.endsWith(p));

    // If client-side viewer block, just bubble up without trying refresh/logout
    if ((cfg as any)?.__viewerWriteBlock) {
      return Promise.reject(error);
    }

    if (status === 403) {
      // Forbidden is a permissions issue; don't logout or refresh globally
      return Promise.reject(error);
    }

    if (status === 401) {
      if (isPublic) {
        // For public endpoints, do not attempt refresh or redirect
        return Promise.reject(error);
      }
      // Only retry once per request
      if (!isLoginCall && cfg && !(cfg as any).__isRetry) {
        const newTok = await refreshToken();
        if (newTok && cfg) {
          (cfg as any).__isRetry = true;
          const retryConfig: AxiosRequestConfig = {
            ...cfg,
            headers: { ...(cfg.headers as any), Authorization: `Bearer ${newTok}` },
          };
          return api.request(retryConfig);
        }
      }
      if (!isLoginCall) {
        // If refresh failed or already retried, only logout for non-GET requests.
        const method = ((cfg?.method as string) || 'get').toUpperCase();
        if (method !== 'GET') {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          try { localStorage.setItem(LOGOUT_SENTINEL, '1'); } catch (e) { /* ignore */ void 0; }
          window.location.href = '/login';
        }
        // For GET, bubble up and let callers handle gracefully (avoid auto-logout on dashboard fetches)
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

