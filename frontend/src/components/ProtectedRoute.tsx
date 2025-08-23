// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as notify from '../lib/notify';
import LoadingOverlay from './LoadingOverlay';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingOverlay fullscreen label="Authenticating" />;
  }

  if (!isAuthenticated) {
    notify.error("Session expired. Please log in again.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based route guard for OPERATOR: allow only inbound/outbound/dashboard
  if (user?.role === 'OPERATOR') {
    const path = location.pathname.toLowerCase();
    const allowed = path.startsWith('/inbound') || path.startsWith('/outbound') || path === '/' || path.startsWith('/dashboard');
    if (!allowed) {
      return <Navigate to="/inbound/goods-in" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
