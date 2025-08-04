// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_TOKEN_KEY, IDLE_TIMEOUT_MS } from '../constants';
import api from '../services/api';
import { throttle } from 'lodash'; // Import throttle from lodash

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  // Add other user properties as needed
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
  // Initialize isAuthenticated based on token presence, but verification is still needed.
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(AUTH_TOKEN_KEY));

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      // If token exists, verify it by fetching user profile
      fetchUserProfile();
    } else {
      // If no token, we are not authenticated and not loading.
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      console.log("Idle timer reset"); // Debugging log
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        console.log("Idle timeout reached"); // Debugging log
        if (localStorage.getItem(AUTH_TOKEN_KEY)) {
          logout();
        }
      }, IDLE_TIMEOUT_MS);
    };

    if (isAuthenticated) {
      const throttledReset = throttle(resetIdleTimer, 300); // Throttle to prevent excessive calls
      window.addEventListener('mousemove', throttledReset);
      window.addEventListener('keydown', throttledReset);
      resetIdleTimer(); // Initial setup
    }

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    setIsLoading(true); // Start loading when fetching profile
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile, logging out.', error);
      logout(); // Logout if token is invalid
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setIsAuthenticated(true); // Assume authenticated, fetchUserProfile will verify
    await fetchUserProfile();
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setIsAuthenticated(false);
    // The api interceptor will handle the redirect by clearing the auth header
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
