import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<{ email?: boolean; password?: boolean }>({});

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
        setErrorFields({});
      }, 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(false), 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [successToast]);

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
    setError(null);

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
        setSuccessToast(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('Login failed: No access token received.');
        setErrorFields({ email: true, password: true });
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
        // When backend sends an error, outline both fields for security
        setErrorFields({ email: true, password: true });
      } else {
        setError('An unexpected error occurred. Please try again.');
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
          <div
            className="custom-toast"
            style={{
              backgroundColor: '#ff4d4d',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '5px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px',
              animation: 'fadeIn 0.5s, fadeOut 0.5s 2.5s',
              position: 'relative',
            }}
          >
            {error}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
              }}
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}

        {successToast && (
          <div
            className="custom-toast"
            style={{
              backgroundColor: '#4caf50',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '5px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '10px',
              animation: 'fadeIn 0.5s, fadeOut 0.5s 2.5s',
              position: 'relative',
            }}
          >
            Login successful! Redirecting to dashboard...
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
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
