import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../assets/Logo_Web&App_Project.svg';
import '../styles/SignIn.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');

  const navigate = useNavigate();
  const { login, getRedirectPath } = useAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    setBackendError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
    setBackendError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setBackendError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('Login attempt:', { email });

      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);

      // Call context login
      await login(response, rememberMe);

      // Get redirect path from decoded user
      const redirectPath = getRedirectPath({ role: response.data.user?.role });
      console.log('Redirecting to:', redirectPath);

      // Clear form
      setEmail('');
      setPassword('');

      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.status === 401) {
        setBackendError('Invalid credentials. Please check your email and password.');
      } else if (error.response?.data?.message) {
        setBackendError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setBackendError(error.response.data.error);
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setBackendError('Network error. Please check your connection.');
      } else {
        setBackendError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="brand">
          <div className="logo">
            <img src={logo} alt="logo" />
          </div>
          <div>
            <h2>Smart Road Monitor</h2>
            <div className="brand-subtitle">Sign in to your account</div>
          </div>
        </div>

        {backendError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {backendError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              className={errors.email ? 'input-error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                className={errors.password ? 'input-error' : ''}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="remember-me-row">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="checkbox-custom"></span>
              Remember me
            </label>
          </div>

          <button 
            className={`btn-primary ${loading ? 'btn-loading' : ''}`} 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-content">
                <span className="spinner"></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="signup-link">
            <span className="link-muted">Don't have an account? </span>
            <span className="link-highlight" onClick={() => navigate('/signup')}>
              Sign Up
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

