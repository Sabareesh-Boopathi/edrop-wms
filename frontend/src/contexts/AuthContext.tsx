// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_TOKEN_KEY, IDLE_TIMEOUT_MS } from '../constants';
import api, { refreshToken } from '../services/api';
import { throttle } from 'lodash';
import { useConfig } from './ConfigContext';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(AUTH_TOKEN_KEY));

  const { config, initAfterLogin } = useConfig();

  // Session expiry modal state
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      fetchUserProfile();
      // Ensure config loads after session restore
      void initAfterLogin();
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const timeoutMs = (config.sessionTimeoutMins && config.sessionTimeoutMins > 0)
      ? config.sessionTimeoutMins * 60 * 1000
      : IDLE_TIMEOUT_MS;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (localStorage.getItem(AUTH_TOKEN_KEY)) {
          logout();
        }
      }, timeoutMs);
    };

    if (isAuthenticated) {
      const throttledReset = throttle(resetIdleTimer, 300);
      window.addEventListener('mousemove', throttledReset);
      window.addEventListener('keydown', throttledReset);
      resetIdleTimer();
    }

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [isAuthenticated, config.sessionTimeoutMins]);

  // Listen for pre-expiry warning (60s)
  useEffect(() => {
    const handler = () => {
      setShowExpiryModal(true);
      setCountdown(60);
      if (countdownTimer) window.clearInterval(countdownTimer);
      const id = window.setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            window.clearInterval(id);
            // Auto-logout if user doesn't act
            logout();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      setCountdownTimer(id);
    };
    window.addEventListener('token-pre-expiry', handler as EventListener);
    return () => {
      window.removeEventListener('token-pre-expiry', handler as EventListener);
      if (countdownTimer) window.clearInterval(countdownTimer);
    };
  }, [countdownTimer]);

  const extendSession = async () => {
    const newTok = await refreshToken();
    if (newTok) {
      setShowExpiryModal(false);
      if (countdownTimer) window.clearInterval(countdownTimer);
    } else {
      logout();
    }
  };

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile, logging out.', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setIsAuthenticated(true);
    await fetchUserProfile();
    // Load system config post-login
    await initAfterLogin();
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    delete (api.defaults.headers as any).common?.['Authorization'];
    // Redirect to login handled by interceptor on next 401/403, or force now:
    window.location.href = '/login';
  };

  return (
    <>
      <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
        {children}
      </AuthContext.Provider>
      {showExpiryModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(3px)', background: 'rgba(15,23,42,0.25)' }} />
          <div style={{ position: 'relative', maxWidth: 420, margin: '10vh auto', background: '#fff', borderRadius: 12, boxShadow: '0 12px 28px rgba(16,24,40,0.15)', border: '1px solid #e6eaf0', padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Session expiring soon</h3>
            <p style={{ color: '#475569', marginTop: 8 }}>Your session will expire in {countdown}s due to inactivity. Do you want to stay signed in?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={logout} className="btn-outline-token">Logout</button>
              <button onClick={extendSession} className="btn-primary-token">Stay signed in</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
