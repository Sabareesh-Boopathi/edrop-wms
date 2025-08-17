import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Login.css';
import * as notify from '../lib/notify';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // local toast for client-side validation
  const [errorFields, setErrorFields] = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  // Auto-dismiss the local validation error toast
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
        setErrorFields({});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validate = () => {
    setErrorFields({});
    if (!email) {
  setError('Email is required');
      setErrorFields({ email: true });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
  setError('Email is invalid');
      setErrorFields({ email: true });
      return false;
    }
    if (!password) {
  setError('Password is required');
      setErrorFields({ password: true });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/login/access-token', new URLSearchParams({
        username: email,
        password: password,
      }));

      if (response.data.access_token) {
        await login(response.data.access_token);
        notify.success('Login successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        notify.error('Login failed: No access token received.');
        setErrorFields({ email: true, password: true });
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
  // backend failure → global notify
  notify.error(err.response.data.detail);
        // When backend sends an error, outline both fields for security
        setErrorFields({ email: true, password: true });
      } else {
  notify.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">eDrop</h1>
        <p className="login-subtitle">Welcome back to WMS</p>

        {error && (
          <div className="custom-toast error">
            {error}
            <button className="close-btn" onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`login-input ${errorFields.email ? 'error-outline' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <label htmlFor="password" className="login-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className={`login-input ${errorFields.password ? 'error-outline' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <div className="forgot-password">
            <a href="#">Forgot Password?</a>
          </div>
          <button type="submit" className="login-button btn-primary-token" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
