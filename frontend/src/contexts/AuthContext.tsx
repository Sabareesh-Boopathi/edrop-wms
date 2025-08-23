// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import './AuthContext.css';
import { AUTH_TOKEN_KEY, IDLE_TIMEOUT_MS } from '../constants';
import api, { refreshToken } from '../services/api';
import { throttle } from 'lodash';
import { useConfig } from './ConfigContext';

// Matches backend /users/me schema minimally for our needs
interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  warehouse_id?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  // Role helpers
  isAdmin: boolean;
  isManager: boolean;
  isOperator: boolean;
  isViewer: boolean;
  isReadOnly: boolean; // true for VIEWER
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
  try {
        localStorage.setItem('AUTH_USER_ROLE', response.data?.role || '');
        localStorage.setItem('AUTH_USER_WAREHOUSE_ID', response.data?.warehouse_id || '');
  } catch (e) { /* ignore storage errors */ }
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
  try {
      localStorage.removeItem('AUTH_USER_ROLE');
      localStorage.removeItem('AUTH_USER_WAREHOUSE_ID');
  } catch (e) { /* ignore storage errors */ }
    setUser(null);
    setIsAuthenticated(false);
    delete (api.defaults.headers as any).common?.['Authorization'];
    // Redirect to login handled by interceptor on next 401/403, or force now:
    window.location.href = '/login';
  };

  return (
    <>
      <AuthContext.Provider
        value={{
          isAuthenticated,
          user,
          login,
          logout,
          isLoading,
          isAdmin: user?.role === 'ADMIN',
          isManager: user?.role === 'MANAGER',
          isOperator: user?.role === 'OPERATOR',
          isViewer: user?.role === 'VIEWER',
          isReadOnly: user?.role === 'VIEWER',
        }}
      >
        {children}
      </AuthContext.Provider>
      {showExpiryModal && (
        <div className="session-overlay">
          <div className="session-overlay-backdrop" />
          <div className="session-modal">
            <h3>Session expiring soon</h3>
            <p>Your session will expire in {countdown}s due to inactivity. Do you want to stay signed in?</p>
            <div className="actions">
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
