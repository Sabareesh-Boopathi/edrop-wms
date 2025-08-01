import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  React.useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as HTMLFormElement).email.value;
    const password = (e.target as HTMLFormElement).password.value;

    // Simulate login validation
    if (email !== 'test@example.com' || password !== 'password') {
      setError('Invalid login credentials');
      setShowToast(true);
    } else {
      setError(null);
      setShowToast(false);
      setSuccessToast(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000); // Redirect after 3 seconds
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(false), 3000); // Auto-dismiss after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">LOGIN</h1>
        <p className="login-subtitle">Welcome back</p>

        {showToast && (
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
              onClick={() => setShowToast(false)}
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

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={`login-input ${error && showToast ? 'error-outline' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password" className="login-label">
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              className={`login-input ${error && showToast ? 'error-outline' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="forgot-password">
            <a href="#">Forgot Password?</a>
          </div>

          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
