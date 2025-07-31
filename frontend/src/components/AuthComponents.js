import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import { useAccessibility } from './AccessibilityProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorBoundary';

// Login Form Component
export const LoginForm = ({ onSuccess, onSwitchToRegister, onSwitchToForgotPassword }) => {
  const { login } = useAuth();
  const { announce } = useAccessibility();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.status === 423) {
        setError('Your account has been temporarily locked due to too many failed login attempts. Please try again later.');
        announce('Account temporarily locked', 'assertive');
        return;
      }

      if (response.status === 429) {
        setError('Too many login attempts. Please try again later.');
        announce('Rate limit exceeded', 'assertive');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Login failed');
        announce('Login failed', 'assertive');
        return;
      }

      // Store session tokens and login
      await login(data.session.token, data.user, data.session.refreshToken, data.session.expiresAt);
      announce('Successfully logged in', 'polite');
      
      if (onSuccess) onSuccess(data.user);

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      announce('Network error during login', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In to PNIT</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Access your personal network intelligence
          </p>
        </div>

        {error && (
          <ErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-primary hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary hover:text-blue-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Registration Form Component
export const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const { login } = useAuth();
  const { announce } = useAccessibility();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Check password strength
    if (name === 'password') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }

    // Clear error when user starts typing
    if (error) setError(null);
  };

  const evaluatePasswordStrength = (password) => {
    if (!password) return null;
    
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    return {
      score: passedChecks,
      checks,
      strength: passedChecks < 3 ? 'weak' : passedChecks < 5 ? 'medium' : 'strong'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordStrength || passwordStrength.score < 5) {
      setError('Password must meet all security requirements');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.status === 429) {
        setError('Too many registration attempts. Please try again later.');
        announce('Rate limit exceeded', 'assertive');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        announce('Registration failed', 'assertive');
        return;
      }

      // Store session tokens and login
      await login(data.session.token, data.user, data.session.refreshToken, data.session.expiresAt);
      announce('Successfully registered and logged in', 'polite');
      
      if (onSuccess) onSuccess(data.user);

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      announce('Network error during registration', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join PNIT to explore your network intelligence
          </p>
        </div>

        {error && (
          <ErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Password Strength Indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Password Strength
                  </span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength === 'strong' ? 'text-green-600' :
                    passwordStrength.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 'strong' ? 'bg-green-600' :
                      passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="grid grid-cols-2 gap-1">
                    <span className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}>
                      ✓ 8+ characters
                    </span>
                    <span className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Uppercase
                    </span>
                    <span className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Lowercase
                    </span>
                    <span className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Number
                    </span>
                    <span className={passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'} style={{ gridColumn: 'span 2' }}>
                      ✓ Special character (@$!%*?&)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !passwordStrength || passwordStrength.score < 5}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// Forgot Password Form Component
export const ForgotPasswordForm = ({ onSuccess, onSwitchToLogin }) => {
  const { announce } = useAccessibility();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.status === 429) {
        setError('Too many password reset attempts. Please try again later.');
        announce('Rate limit exceeded', 'assertive');
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        announce('Password reset request failed', 'assertive');
        return;
      }

      setSuccess(true);
      announce('Password reset email sent', 'polite');

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      announce('Network error', 'assertive');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            If an account with that email exists, we've sent you a password reset link.
          </p>
          <button
            onClick={onSwitchToLogin}
            className="text-primary hover:text-blue-700 font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Your Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        {error && (
          <ErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Sending reset link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

// Authentication Modal Component
export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSuccess = (user) => {
    onClose();
    // Could redirect or show success message here
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-900 rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {mode === 'login' && (
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setMode('register')}
                onSwitchToForgotPassword={() => setMode('forgot-password')}
              />
            )}
            {mode === 'register' && (
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
            {mode === 'forgot-password' && (
              <ForgotPasswordForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default { LoginForm, RegisterForm, ForgotPasswordForm, AuthModal };