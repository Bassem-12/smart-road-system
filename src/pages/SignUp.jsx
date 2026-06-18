import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import logo from '../assets/Logo_Web&App_Project.svg';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'User'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, getRedirectPath } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = getRedirectPath({ role: 'User' });
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, getRedirectPath]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setBackendError('');
    setSuccessMessage('');
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('One special character');
    }
    return errors;
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = validatePassword(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain: ${passwordErrors.join(', ')}`;
      }
    }
    
    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    setBackendError('');
    setSuccessMessage('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create the account
      const response = await api.post('/auth/register', { 
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role
      });

      const data = response.data;


      if (!token) {
        // If no token returned, show success and redirect to sign in
        setSuccessMessage(message || 'Account created successfully! Please sign in.');
        setTimeout(() => {
          navigate('/signin', { 
            state: { 
              from: location, 
              message: 'Account created successfully! Please sign in.' 
            } 
          });
        }, 1500);
        return;
      }
      
      // Login with the token
      await login(data.token, false);
      
      if (!loginResult.success) {
        setBackendError(loginResult.error || 'Auto-login failed after registration');
        return;
      }
      
      // Decode token and redirect based on role
      try {
        const decoded = jwtDecode(token);
        const redirectPath = getRedirectPath(decoded);
        
        // Clear form fields
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'User'
        });
        
        // Show success message briefly before redirect
        setSuccessMessage(message || 'Account created and logged in successfully!');
        
        // Navigate to the appropriate dashboard
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 500);
      } catch (err) {
        // Fallback to main dashboard if decoding fails
        setSuccessMessage('Account created successfully!');
        setTimeout(() => {
          navigate('/main-dashboard', { replace: true });
        }, 500);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle backend error message
      if (error.response?.data?.message) {
        setBackendError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setBackendError(error.response.data.error);
      } else if (error.request) {
        setBackendError('Network error. Please check your connection.');
      } else if (error.message) {
        setBackendError(error.message);
      } else {
        setBackendError('Registration failed. Please try again.');
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
            <img 
              src={logo} 
              alt="logo" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span>📊</span>';
              }} 
            />
          </div>
          <div>
            <h2>Create Account</h2>
            <div className="brand-subtitle">
              Sign up and get started
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-banner">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
        )}

        {/* Backend Error Message */}
        {backendError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {backendError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* First Name & Last Name Row */}
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Ahmed"
                className={errors.firstName ? 'input-error' : ''}
                disabled={loading}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <span className="error-message">{errors.firstName}</span>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Hassan"
                className={errors.lastName ? 'input-error' : ''}
                disabled={loading}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <span className="error-message">{errors.lastName}</span>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={errors.email ? 'input-error' : ''}
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* Role Dropdown */}
          <div className="input-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={errors.role ? 'input-error' : ''}
              disabled={loading}
            >
              <option value="User">User</option>
              <option value="Officer">Officer</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && (
              <span className="error-message">{errors.role}</span>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                className={errors.password ? 'input-error' : ''}
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={errors.confirmPassword ? 'input-error' : ''}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <button 
            className={`btn-primary ${loading ? 'btn-loading' : ''}`} 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-content">
                <span className="spinner"></span>
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>

          <div className="signup-link">
            <span className="link-muted">Already have an account? </span>
            <span
              className="link-highlight"
              onClick={() => !loading && navigate('/signin')}
            >
              Sign In
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
